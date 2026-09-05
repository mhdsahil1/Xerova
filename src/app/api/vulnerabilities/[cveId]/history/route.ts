// ============================================================
// XEROVA — CVE Change History API Route
// Powered by NVD CVE Change History API 2.0 (cvehistory/2.0)
// ============================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getNVD_CVEHistory } from "@/lib/nvd";

export async function GET(
  request: Request,
  props: { params: Promise<{ cveId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cveId } = await props.params;
    if (!cveId) {
      return NextResponse.json({ error: "CVE ID is required" }, { status: 400 });
    }

    const rl = checkRateLimit(`cve-history:${session.user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before requesting change history.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get("eventName") || undefined;
    const startIndex = parseInt(searchParams.get("startIndex") || "0", 10);
    const resultsPerPage = parseInt(searchParams.get("resultsPerPage") || "50", 10);

    const history = await getNVD_CVEHistory(cveId, {
      eventName,
      startIndex,
      resultsPerPage,
    });

    return NextResponse.json({
      cveId: cveId.toUpperCase(),
      totalEvents: history.length,
      history,
    });
  } catch (error) {
    console.error("[CVE History API Error]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve CVE Change History from NVD." },
      { status: 500 }
    );
  }
}
