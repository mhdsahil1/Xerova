// ============================================
// XEROVA — Threat Lookup API Route
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeQuery, scoreToSeverity } from "@/lib/sanitize";
import { mergedHashLookup, nvdLookupCVE } from "@/lib/threat-apis";
import {
  enrichedIPLookup,
  enrichedDomainLookup,
  enrichedURLLookup,
} from "@/lib/ip2-intelligence";
import ThreatSearch from "@/models/ThreatSearch";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = checkRateLimit(`lookup:${session.user.id}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before trying again.", retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { query, type } = sanitizeQuery(body.query, body.type);

    let results: Record<string, unknown> = {};
    let riskScore = 0;

    switch (type) {
      case "ip": {
        const data = await enrichedIPLookup(query);
        results = data as unknown as Record<string, unknown>;
        riskScore = data.riskScore;
        break;
      }
      case "domain": {
        const data = await enrichedDomainLookup(query);
        results = data as unknown as Record<string, unknown>;
        riskScore = data.riskScore;
        break;
      }
      case "url": {
        const data = await enrichedURLLookup(query);
        results = data as unknown as Record<string, unknown>;
        riskScore = data.riskScore;
        break;
      }
      case "hash": {
        const hashData = await mergedHashLookup(query);
        results = hashData as unknown as Record<string, unknown>;
        riskScore = hashData.riskScore;
        break;
      }
      case "cve": {
        const nvdData = await nvdLookupCVE(query.toUpperCase());
        if (!nvdData) {
          results = {
            id: query.toUpperCase(),
            sources: [],
            riskScore: 0,
            severity: "info",
            error: "CVE not found in NVD database.",
          };
        } else {
          riskScore = Math.min(100, Math.round((nvdData.cvssScore as number) * 10));
          results = { ...nvdData, riskScore, sources: ["NVD"] };
        }
        break;
      }
    }

    const finalSeverity =
      ((results as Record<string, unknown>).severity as string) ||
      scoreToSeverity(riskScore);

    const userId = session.user.id;
    connectDB()
      .then(() =>
        ThreatSearch.create({
          userId,
          query,
          type,
          results,
          riskScore,
          severity: finalSeverity,
          tags: (results as Record<string, unknown>).sources
            ? ((results as Record<string, unknown>).sources as string[])
            : [],
        })
      )
      .catch((e) => console.error("Failed to store search:", e));

    return NextResponse.json({ query, type, results, riskScore, severity: finalSeverity });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("[Threat Lookup Error]:", msg);
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("not allowed") || msg.includes("Invalid") ? 400 : 500 }
    );
  }
}
