import type { NextAuthConfig } from "next-auth";

// 30 days session persistence in seconds (2,592,000 seconds)
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60, // Refresh session token expiry daily
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      },
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isAuthRoute =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/login/") ||
        pathname.startsWith("/register/");

      // If user is already authenticated and visits /login or /register,
      // redirect them straight to their target or dashboard
      if (isAuthRoute) {
        if (isLoggedIn) {
          const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/dashboard";
          const safeTarget =
            callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
              ? callbackUrl
              : "/dashboard";
          return Response.redirect(new URL(safeTarget, request.nextUrl));
        }
        return true;
      }

      // For protected routes, require valid session
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
