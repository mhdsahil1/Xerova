import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyEmailAddress } from "./email-validator";
import { checkRateLimit } from "./rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const emailStr = String(credentials.email).trim().toLowerCase();
        const passwordStr = String(credentials.password);

        // Brute-force protection: max 5 login attempts per 5 minutes per target account
        const loginRL = checkRateLimit(`login:${emailStr}`, 5, 5 * 60_000);
        if (!loginRL.allowed) {
          throw new Error("Too many login attempts. Please wait 5 minutes before trying again.");
        }

        const verification = await verifyEmailAddress(emailStr);
        if (!verification.isValid && verification.isDisposable) {
          throw new Error("Disposable or temporary email accounts are not permitted.");
        }

        await connectDB();

        const user = await User.findOne({
          email: emailStr,
        }).select("+password");

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          passwordStr,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Reject unverified credential accounts
        if (user.provider !== "google" && user.emailVerified !== true) {
          throw new Error("Please verify your email before logging in.");
        }

        // Reject incomplete accounts if attempting credential login without completion
        if (user.registrationCompleted === false) {
          throw new Error("Please complete your account registration first.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();

        const cleanEmail = user.email?.toLowerCase().trim();
        const existingUser = await User.findOne({ email: cleanEmail });

        if (!existingUser) {
          await User.create({
            name: user.name || "Analyst",
            email: cleanEmail,
            image: user.image || "",
            provider: "google",
            emailVerified: true,
            registrationCompleted: false, // New Google accounts must complete registration
          });
        } else if (!existingUser.emailVerified) {
          existingUser.emailVerified = true;
          await existingUser.save();
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        try {
          await connectDB();
          const cleanEmail = user.email?.toLowerCase().trim();
          const dbUser = await User.findOne({ email: cleanEmail });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.registrationCompleted = dbUser.registrationCompleted !== false;
            token.name = dbUser.name;
          } else {
            // Fallback for just-created or missing users
            token.id = user.id;
          }
        } catch (error) {
          console.error("JWT callback DB error:", error);
          token.id = user.id;
        }
      } else if (trigger === "update" || token.registrationCompleted === false) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            token.registrationCompleted = dbUser.registrationCompleted !== false;
            token.name = dbUser.name;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("JWT update DB error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.registrationCompleted = token.registrationCompleted as boolean | undefined;
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
  },
});
