import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    // Auth routes (redirect to dashboard if already authenticated)
    "/login",
    "/login/:path*",
    "/register",
    "/register/:path*",
    // Protect dashboard routes
    "/dashboard",
    "/dashboard/:path*",
    "/threats",
    "/threats/:path*",
    "/assistant",
    "/assistant/:path*",
    "/reports",
    "/reports/:path*",
    "/settings",
    "/settings/:path*",
    "/browser-guard",
    "/browser-guard/:path*",
    "/vulnerabilities",
    "/vulnerabilities/:path*",
  ],
};
