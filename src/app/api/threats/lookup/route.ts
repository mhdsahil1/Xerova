// ============================================
// XEROVA — Threat Lookup API Route
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeQuery, scoreToSeverity } from "@/lib/sanitize";
import {
  mergedIPLookup,
  mergedDomainLookup,
  vtLookupURL,
  vtLookupHash,
  nvdLookupCVE,
} from "@/lib/threat-apis";
import ThreatSearch from "@/models/ThreatSearch";

export async function POST(request: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const rl = checkRateLimit(`lookup:${session.user.id}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before trying again.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Parse & validate input
    const body = await request.json();
    const { query, type } = sanitizeQuery(body.query, body.type);

    // Execute lookup based on type
    let results: Record<string, unknown> = {};
    let riskScore = 0;

    switch (type) {
      case "ip": {
        const data = await mergedIPLookup(query);
        results = data;
        riskScore = data.riskScore;
        break;
      }

      case "domain": {
        const data = await mergedDomainLookup(query);
        results = data as unknown as Record<string, unknown>;
        riskScore = data.riskScore;
        break;
      }

      case "url": {
        const vtData = await vtLookupURL(query);
        if (!vtData) {
          results = {
            url: query,
            sources: [],
            riskScore: 0,
            severity: "info",
            error: "Unable to analyze URL. VirusTotal may be unavailable.",
          };
        } else if ((vtData as Record<string, unknown>).status === "queued") {
          results = {
            url: query,
            status: "queued",
            message: "URL submitted for analysis. Please try again in a minute.",
            sources: ["VirusTotal"],
            riskScore: 0,
            severity: "info",
          };
        } else {
          const stats = (vtData as Record<string, unknown>)
            .lastAnalysisStats as Record<string, number>;
          const malicious = stats?.malicious ?? 0;
          const total =
            malicious + (stats?.undetected ?? 0) + (stats?.harmless ?? 0);
          riskScore =
            total > 0
              ? Math.min(100, Math.round((malicious / total) * 100))
              : 0;
          results = {
            ...(vtData as Record<string, unknown>),
            riskScore,
            severity: scoreToSeverity(riskScore),
            sources: ["VirusTotal"],
          };
        }
        break;
      }

      case "hash": {
        const vtData = await vtLookupHash(query);
        if (!vtData) {
          results = {
            hash: query,
            sources: [],
            riskScore: 0,
            severity: "info",
            error: "Hash not found in VirusTotal database.",
          };
        } else {
          const stats = vtData.lastAnalysisStats as Record<string, number>;
          const malicious = (stats?.malicious ?? 0) + (stats?.suspicious ?? 0);
          const total =
            malicious + (stats?.undetected ?? 0) + (stats?.harmless ?? 0);
          riskScore =
            total > 0
              ? Math.min(100, Math.round((malicious / total) * 100))
              : 0;
          results = {
            ...vtData,
            riskScore,
            severity: scoreToSeverity(riskScore),
            detectionRate: `${malicious}/${total}`,
            sources: ["VirusTotal"],
          };
        }
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
          riskScore = Math.min(
            100,
            Math.round((nvdData.cvssScore as number) * 10)
          );
          results = {
            ...nvdData,
            riskScore,
            sources: ["NVD"],
          };
        }
        break;
      }
    }

    // Store search in DB (fire-and-forget)
    const userId = session?.user?.id;
    if (userId) {
      connectDB()
        .then(() =>
          ThreatSearch.create({
            userId,
            query,
            type,
            results,
            riskScore,
            severity: scoreToSeverity(riskScore),
            tags: (results as Record<string, unknown>).sources
              ? ((results as Record<string, unknown>).sources as string[])
              : [],
          })
        )
        .catch((e) => console.error("Failed to store search:", e));
    }

    return NextResponse.json({
      query,
      type,
      results,
      riskScore,
      severity: scoreToSeverity(riskScore),
    });
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("[Threat Lookup Error]:", msg);
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("not allowed") || msg.includes("Invalid") ? 400 : 500 }
    );
  }
}
