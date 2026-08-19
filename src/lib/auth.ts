import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const providers = [];

// Only enable Google provider if credentials exist to prevent NextAuth Configuration error
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

// Credentials provider for standard & demo logins
providers.push(
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

      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string;

      // Built-in demo accounts for effortless testing/evaluation
      const isDefaultAdmin = email === "admin@xerova.io" && password === "admin123";
      const isDefaultAnalyst =
        (email === "analyst@xerova.io" || email === "demo@xerova.io") &&
        (password === "password123" || password === "admin123");

      if (isDefaultAdmin || isDefaultAnalyst) {
        const conn = await connectDB();
        if (conn) {
          try {
            let testUser = await User.findOne({ email });
            if (!testUser) {
              const hashedPassword = await bcrypt.hash(password, 10);
              testUser = await User.create({
                name: isDefaultAdmin ? "Xerova Administrator" : "Security Analyst",
                email,
                password: hashedPassword,
                role: "admin",
              });
            }
            return {
              id: testUser._id.toString(),
              name: testUser.name || (isDefaultAdmin ? "Xerova Administrator" : "Security Analyst"),
              email: testUser.email,
              image: testUser.image || "",
            };
          } catch (e) {
            console.warn("[Auth] DB user creation fallback:", e);
          }
        }

        return {
          id: "demo-analyst-001",
          name: isDefaultAdmin ? "Xerova Administrator" : "Security Analyst",
          email,
          image: "",
        };
      }

      const conn = await connectDB();
      if (!conn) {
        throw new Error("Database not connected");
      }

      const user = await User.findOne({
        email,
      }).select("+password");

      if (!user || !user.password) {
        throw new Error("Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET || "xerova-secret-key-32chars-min-jwt-auth-2026",
  trustHost: true,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const conn = await connectDB();
        if (conn) {
          try {
            const existingUser = await User.findOne({ email: user.email });
            if (!existingUser) {
              await User.create({
                name: user.name,
                email: user.email,
                image: user.image,
                provider: "google",
              });
            }
          } catch (e) {
            console.error("Google signIn DB error:", e);
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || "demo-analyst-001";
        token.role = (user as Record<string, unknown>).role || "admin";
        token.name = user.name || "Security Analyst";
        token.email = user.email || "admin@xerova.io";

        const conn = await connectDB();
        if (conn) {
          try {
            const dbUser = await User.findOne({ email: user.email });
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role;
            }
          } catch (error) {
            console.error("JWT callback DB error:", error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "demo-analyst-001";
        (session.user as unknown as Record<string, unknown>).role = token.role || "admin";
      }
      return session;
    },
  },
});
