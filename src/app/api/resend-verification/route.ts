import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/gmail";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit(`resend-ip:${clientIp}`, 5, 10 * 60_000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification requests from this network. Please wait a few minutes.",
          retryAfterMs: ipLimit.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!rawEmail || !/^\S+@\S+\.\S+$/.test(rawEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid email address.",
        },
        { status: 400 }
      );
    }

    // Abuse protection per email (3 requests per 5 minutes per email)
    const rl = checkRateLimit(`resend:${rawEmail}`, 3, 5 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification requests for this account. Please wait a few minutes before trying again.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    await connectDB();

    // Query user explicitly including select: false token fields
    const user = await User.findOne({ email: rawEmail }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    // Only process unverified credential accounts
    if (user && user.provider !== "google" && user.emailVerified !== true) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = tokenExpires;
      await user.save();

      const rawAppUrl =
        process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const appUrl = rawAppUrl.replace(/\/+$/, "");
      const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendVerificationEmail({
          to: user.email,
          name: user.name,
          verificationUrl,
        });
      } catch (mailError) {
        // Sanitized log: never log raw token, full URL, or OAuth credentials
        console.error(
          "[Resend Verification] Failed to deliver verification email:",
          mailError instanceof Error ? mailError.message : "Unknown error"
        );
      }
    }

    // Constant generic anti-enumeration response
    return NextResponse.json({
      success: true,
      message: "If the account exists and requires verification, a verification email has been sent.",
    });
  } catch (error) {
    console.error(
      "[Resend Verification API] Unexpected error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process verification request at this time.",
      },
      { status: 500 }
    );
  }
}
