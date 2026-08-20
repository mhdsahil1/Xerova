// ============================================
// XEROVA — Extension URL Analysis API Route (Public)
// ============================================
// Lightweight public endpoint for the Browser Guard extension.
// Reuses the existing analyzeURL() engine but uses IP-based
// rate limiting instead of requiring NextAuth session.
// Does NOT modify the existing authenticated endpoint.

import { NextResponse } from "next/server";
import { analyzeURL } from "@/lib/url-analysis-service";

// --- Simple in-memory IP rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkIPRateLimit(
  ip: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300_000); // every 5 minutes

export async function POST(request: Request) {
  try {
    // Extract client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    // Rate limit check (10 requests per minute per IP)
    const rl = checkIPRateLimit(ip, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before trying again.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Parse input
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL parameter is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Validate protocol
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "Only HTTP and HTTPS URLs are supported" },
        { status: 400 }
      );
    }

    // Perform analysis using existing engine
    const analysis = await analyzeURL(url);

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
    console.error("[Extension URL Analysis] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
