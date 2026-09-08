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
      const isRegistrationComplete =
        (auth?.user as unknown as { registrationCompleted?: boolean })
          ?.registrationCompleted !== false;

      const isCompletePage = pathname === "/register/complete";
      const isAuthRoute =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/login/") ||
        (pathname.startsWith("/register/") && !isCompletePage);

      // Case 1: Unauthenticated visitors
      if (!isLoggedIn) {
        // Direct attempt to view completion page without signing in
        if (isCompletePage) {
          return Response.redirect(new URL("/register", request.nextUrl));
        }
        // Public auth routes (login, register)
        if (isAuthRoute) {
          return true;
        }
        // Protected application routes require login
        return false;
      }

      // Case 2: Authenticated but incomplete registration (e.g. newly provisioned Google account)
      if (!isRegistrationComplete) {
        // Allow access to the completion page
        if (isCompletePage) {
          return true;
        }
        // For any other page (dashboard, login, threats, etc.), redirect to registration completion
        return Response.redirect(new URL("/register/complete", request.nextUrl));
      }

      // Case 3: Authenticated and fully registered
      // Redirect away from auth pages and completion page to dashboard
      if (isAuthRoute || isCompletePage) {
        const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/dashboard";
        const safeTarget =
          callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
            ? callbackUrl
            : "/dashboard";
        return Response.redirect(new URL(safeTarget, request.nextUrl));
      }

      // Allow all protected application routes
      return true;
    },
  },
} satisfies NextAuthConfig;
