import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rl = checkRateLimit(`verify-ip:${clientIp}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification attempts. Please wait a moment before trying again.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification link.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Hash the raw token with SHA-256 to match against database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    // Atomic update: finds matching unexpired token and marks verified in one atomic operation
    const user = await User.findOneAndUpdate(
      {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
        emailVerified: { $ne: true },
      },
      {
        $set: { emailVerified: true },
        $unset: {
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
        },
      },
      { returnDocument: "after" }
    );

    // Uniform 400 response for invalid, expired, or replayed tokens
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification link.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    // Sanitized logging: never log raw token or sensitive query parameters
    console.error(
      "[Verify Email API] Unexpected verification error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify email at this time. Please try again later.",
      },
      { status: 500 }
    );
  }
}
