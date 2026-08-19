import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || "xerova-secret-key-32chars-min-jwt-auth-2026",
  trustHost: true,
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
