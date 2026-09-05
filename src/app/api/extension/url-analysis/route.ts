// ============================================
// XEROVA — Extension URL Analysis API Route (Public)
// ============================================
// Lightweight public endpoint for the Browser Guard extension.
// Reuses the existing analyzeURL() engine but uses IP-based
// rate limiting instead of requiring NextAuth session.
// Does NOT modify the existing authenticated endpoint.

import { NextResponse } from "next/server";
import { analyzeURL } from "@/lib/url-analysis-service";
import { validateAndSanitizeURL } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Extract validated client IP for rate limiting
    const ip = getClientIp(request);

    // Strict rate limit for public extension endpoint (10 requests per minute per IP)
    const rl = checkRateLimit(`ext-url:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      const resp = NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before trying again.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
      resp.headers.set("Access-Control-Allow-Origin", "*");
      return resp;
    }

    // Parse input safely
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== "string") {
      const resp = NextResponse.json(
        { error: "URL parameter is required and must be a string" },
        { status: 400 }
      );
      resp.headers.set("Access-Control-Allow-Origin", "*");
      return resp;
    }

    // Comprehensive SSRF and format validation
    const validation = validateAndSanitizeURL(url);
    if (!validation.safe || !validation.url) {
      const resp = NextResponse.json(
        { error: validation.error || "Invalid or restricted URL format" },
        { status: 400 }
      );
      resp.headers.set("Access-Control-Allow-Origin", "*");
      return resp;
    }

    // Perform analysis using existing engine
    const analysis = await analyzeURL(validation.url);

    // Return with CORS headers for extension
    const response = NextResponse.json({
      success: true,
      data: analysis,
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Extension-Client");

    return response;
  } catch (error) {
    console.error("[Extension URL Analysis] Error:", error instanceof Error ? error.message : "Unknown error");
    const resp = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    resp.headers.set("Access-Control-Allow-Origin", "*");
    return resp;
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Extension-Client");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}
