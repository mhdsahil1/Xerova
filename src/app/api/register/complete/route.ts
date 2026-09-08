import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { completeRegistrationSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();

    // Verify user is authenticated with a pending/active session
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in with Google before completing registration." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(request);
    const rl = checkRateLimit(`reg-complete:${session.user.id}:${clientIp}`, 5, 5 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please wait a few minutes before trying again.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Server-side validation
    const validatedData = completeRegistrationSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, password } = validatedData.data;

    await connectDB();

    // Query user by session id or session email
    const user = await User.findOne({
      $or: [{ _id: session.user.id }, { email: session.user.email.toLowerCase().trim() }],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found. Please try signing in again." },
        { status: 404 }
      );
    }

    // Prevent re-registering an already completed account
    if (user.registrationCompleted === true) {
      return NextResponse.json(
        { error: "Registration has already been completed for this account." },
        { status: 400 }
      );
    }

    // Securely hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user document
    user.name = name.trim();
    user.password = hashedPassword;
    user.registrationCompleted = true;
    user.emailVerified = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully. Access granted to intelligence console.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("[Complete Registration Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while completing registration. Please try again." },
      { status: 500 }
    );
  }
}
