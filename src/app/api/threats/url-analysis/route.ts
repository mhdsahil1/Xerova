// ============================================
// XEROVA — URL Analysis API Route
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateAndSanitizeURL } from "@/lib/sanitize";
import { analyzeURL } from "@/lib/url-analysis-service";

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const rl = checkRateLimit(`url-analysis:${session.user.id}`, 20, 60_000);
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
    const body = await request.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL parameter is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate URL against SSRF, dangerous schemes, blocked ports & private IPs
    const validation = validateAndSanitizeURL(url);
    if (!validation.safe || !validation.url) {
      return NextResponse.json(
        { error: validation.error || "Invalid or prohibited URL format" },
        { status: 400 }
      );
    }

    // Perform analysis with validated safe URL
    const analysis = await analyzeURL(validation.url);

    // Store analysis in database (optional)
    try {
      await connectDB();
      // You can store the analysis result here if needed
    } catch (dbError) {
      console.error("[URL Analysis] DB error (non-critical):", dbError);
      // Continue without storing
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("[URL Analysis] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
