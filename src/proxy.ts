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
    "/dashboard/:path*",
    "/threats/:path*",
    "/assistant/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/browser-guard/:path*",
    "/vulnerabilities/:path*",
  ],
};
