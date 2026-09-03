import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations";
import { verifyEmailAddress } from "@/lib/email-validator";
import { sendVerificationEmail } from "@/lib/gmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedData.data;

    // Verify email address against spam/fake/disposable databases
    const emailVerification = await verifyEmailAddress(email);
    if (!emailVerification.isValid) {
      return NextResponse.json(
        { error: emailVerification.reason || "Invalid or disposable email address." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate cryptographically secure verification token & SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create user with emailVerified=false and hashed verification token
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      provider: "credentials",
      emailVerified: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: tokenExpires,
    });

    // Construct verification URL (strip trailing slashes, encode token)
    const rawAppUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const appUrl = rawAppUrl.replace(/\/+$/, "");
    const verificationUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

    // Dispatch verification email via Gmail API with sanitized error handling
    let emailSent = false;
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl,
      });
      emailSent = true;
    } catch (mailError) {
      // Sanitized log: never log raw token, full URL, or authorization headers
      console.error(
        "[Registration] Failed to deliver verification email:",
        mailError instanceof Error ? mailError.message : "Unknown error"
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailSent,
        message: emailSent
          ? "Account created. Check your email to verify your XEROVA account."
          : "Account created, but we were unable to deliver the verification email. Please use the resend option on the sign-in page to receive a new link.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
