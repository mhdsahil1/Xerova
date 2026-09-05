// ============================================================
// XEROVA — Vulnerabilities & CVE Search API
// Powered by authenticated NVD API 2.0
// ============================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getNVD_CVE, searchNVD_CVEs } from "@/lib/nvd";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 30 requests per minute per user
    const rl = checkRateLimit(`cve-search:${session.user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before searching vulnerabilities again.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const keyword = searchParams.get("keyword")?.trim() || "";
    const severityParam = searchParams.get("severity")?.toUpperCase();
    const daysBack = parseInt(searchParams.get("daysBack") || "60", 10);
    const startIndex = parseInt(searchParams.get("startIndex") || "0", 10);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const includeHistory = searchParams.get("includeHistory") === "true";

    // Direct single CVE lookup if query matches CVE format
    const cvePattern = /^CVE-\d{4}-\d{4,7}$/i;
    const targetCveId = query.match(cvePattern) ? query : (keyword.match(cvePattern) ? keyword : null);

    if (targetCveId) {
      const cve = await getNVD_CVE(targetCveId, includeHistory);
      if (!cve) {
        return NextResponse.json(
          {
            error: `Vulnerability ${targetCveId.toUpperCase()} not found in NVD database.`,
            query: targetCveId,
            found: false,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        found: true,
        isSingle: true,
        cve,
      });
    }

    // Otherwise collection search / feed
    const severity =
      severityParam === "CRITICAL" ||
      severityParam === "HIGH" ||
      severityParam === "MEDIUM" ||
      severityParam === "LOW"
        ? severityParam
        : undefined;

    const searchResults = await searchNVD_CVEs({
      keyword: keyword || query || undefined,
      severity,
      daysBack,
      startIndex,
      resultsPerPage: limit,
    });

    return NextResponse.json({
      found: true,
      isSingle: false,
      totalResults: searchResults.totalResults,
      startIndex: searchResults.startIndex,
      resultsPerPage: searchResults.resultsPerPage,
      vulnerabilities: searchResults.vulnerabilities,
    });
  } catch (error) {
    console.error("[Vulnerabilities API Error]:", error);
    return NextResponse.json(
      { error: "Failed to query National Vulnerability Database." },
      { status: 500 }
    );
  }
}
