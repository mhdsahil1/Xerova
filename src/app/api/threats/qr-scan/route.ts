// ============================================
// XEROVA — Anti-Quishing (QR Threat Scan) API Route
// ============================================
// Decodes and inspects QR code payloads:
// • URLs: SSRF-safe redirect resolution + XEROVA unified multi-vendor threat engine
// • Wi-Fi Config: Parsing SSID/Auth/Pass + Security Advisory
// • Plain Text: Entropy analysis + Injection/credential inspection

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveRedirects } from "@/lib/url-resolver";
import {
  classifyPayload,
  parseWifiPayload,
  analyzePlainTextPayload,
} from "@/lib/qr-classifier";
import { analyzeURL } from "@/lib/url-analysis-service";
import ThreatSearch from "@/models/ThreatSearch";
import { scoreToSeverity } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate Limiting (25 scans / min)
    const rl = checkRateLimit(`qr-scan:${session.user.id}`, 25, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded for QR scanning. Please wait a moment.",
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // 3. Payload Extraction
    const body = await request.json().catch(() => ({}));
    const { payload } = body;

    if (!payload || typeof payload !== "string" || !payload.trim()) {
      return NextResponse.json(
        { error: "Payload parameter is required and cannot be empty." },
        { status: 400 }
      );
    }

    const trimmedPayload = payload.trim();
    const classification = classifyPayload(trimmedPayload);

    // ==========================================================
    // Case A: Wi-Fi Configuration Payload
    // ==========================================================
    if (classification === "wifi") {
      const wifiData = parseWifiPayload(trimmedPayload);
      const verdict =
        wifiData.securityRating === "insecure"
          ? "SUSPICIOUS"
          : wifiData.securityRating === "weak"
          ? "SUSPICIOUS"
          : "SAFE";

      return NextResponse.json({
        success: true,
        type: "wifi",
        rawPayload: trimmedPayload,
        verdict,
        wifiData,
      });
    }

    // ==========================================================
    // Case B: Plain Text Payload
    // ==========================================================
    if (classification === "text") {
      const textData = analyzePlainTextPayload(trimmedPayload);
      const hasHighRisk = textData.suspiciousFlags.some((f) => f.severity === "high");
      const verdict = hasHighRisk
        ? "MALICIOUS"
        : textData.suspiciousFlags.length > 0
        ? "SUSPICIOUS"
        : "INFO";

      return NextResponse.json({
        success: true,
        type: "text",
        rawPayload: trimmedPayload,
        verdict,
        textData,
      });
    }

    // ==========================================================
    // Case C: URL Payload (Quishing Threat Analysis)
    // ==========================================================
    const normalizedUrl =
      trimmedPayload.startsWith("http://") || trimmedPayload.startsWith("https://")
        ? trimmedPayload
        : `https://${trimmedPayload}`;

    // Step 4: Resolve Shortened URLs & Redirect Chains Safely
    const resolution = await resolveRedirects(normalizedUrl, 5, 5000);

    // SSRF Violation Blocked
    if (resolution.blockedSSRF) {
      return NextResponse.json({
        success: true,
        type: "url",
        rawPayload: trimmedPayload,
        resolution,
        data: {
          url: normalizedUrl,
          verdict: "MALICIOUS",
          riskScore: 100,
          threatLevel: "CRITICAL",
          severity: "critical",
          reasons: [
            "SSRF Prohibited: URL points to a reserved, loopback, or private internal IP address.",
            resolution.error || "Internal service probing prohibited.",
          ],
          findings: [
            {
              category: "SSRF Protection",
              severity: "CRITICAL",
              description:
                resolution.error ||
                "URL directs traffic to internal cloud metadata or loopback range.",
            },
          ],
          sources: ["XEROVA SSRF Filter"],
          riskFactors: [
            {
              source: "Local URL Analysis",
              category: "SSRF Attack",
              reason: "Restricted private network or loopback address targeted via QR code",
              severity: "CRITICAL",
              scoreContribution: 100,
            },
          ],
          structural: {
            protocol: "unknown",
            domain: "",
            hostname: "",
            port: null,
            path: "",
            query: "",
            urlLength: normalizedUrl.length,
            subdominCount: 0,
            isIPBased: true,
            ipAddress: null,
            entropy: 0,
          },
          urlCharacteristics: {
            usesHTTPS: false,
            hasExcessiveLength: false,
            hasMultipleSubdomains: false,
            hasIPAddress: true,
            hasSuspiciousPort: false,
            hasURLEncoding: false,
            hasObfuscatedCharacters: false,
            hasExcessiveRedirects: false,
            hasHighEntropy: false,
            hasSuspiciousQuery: false,
            redirectionChain: resolution.redirectionChain,
            issues: [resolution.error || "SSRF prohibited"],
          },
          domainCharacteristics: {
            hasPunycode: false,
            hasSuspiciousTLD: false,
            hasExcessiveHyphens: false,
            lookalikeDomains: [],
            brandImpersonationDetected: false,
            impersonatedBrand: null,
            suspiciousKeywords: [],
            domainAge: null,
            issues: [],
          },
          threatIntelligence: {
            virusTotal: null,
            isKnownMalicious: true,
            suspiciousReports: 1,
            abuseScore: null,
          },
          riskBreakdown: {
            localHeuristicRisk: 50,
            urlStructuralRisk: 50,
            domainCharacteristicRisk: 0,
            pathQueryRisk: 0,
            threatIntelligenceRisk: 0,
            totalRisk: 100,
          },
          providerResults: {},
        },
      });
    }

    // Dead / Unresolvable Known Shortener Domain
    if (resolution.isKnownShortener && !resolution.resolved) {
      const deadShortlinkAnalysis = {
        url: normalizedUrl,
        verdict: "SUSPICIOUS" as const,
        riskScore: 65,
        threatLevel: "HIGH" as const,
        severity: "high" as const,
        reasons: [
          "Unresolvable redirect destination / Dead shortlink",
          resolution.error || "Shortener service unreachable or target deleted",
        ],
        findings: [
          {
            category: "Redirect Analysis",
            severity: "HIGH" as const,
            description: `Known shortener domain (${resolution.finalUrl}) failed to resolve. External threat intel engines were intentionally skipped to avoid false-clean ratings on shared shortener hostnames.`,
          },
        ],
        sources: ["Local URL Analysis"],
        riskFactors: [
          {
            source: "Local URL Analysis" as const,
            category: "Dead Shortlink",
            reason:
              "Shortlink destination is unreachable, expired, or returned an HTTP error",
            severity: "HIGH" as const,
            scoreContribution: 40,
          },
        ],
        structural: {
          protocol: "https" as const,
          domain: new URL(normalizedUrl).hostname,
          hostname: new URL(normalizedUrl).hostname,
          port: null,
          path: new URL(normalizedUrl).pathname,
          query: new URL(normalizedUrl).search,
          urlLength: normalizedUrl.length,
          subdominCount: 0,
          isIPBased: false,
          ipAddress: null,
          entropy: 0,
        },
        urlCharacteristics: {
          usesHTTPS: true,
          hasExcessiveLength: false,
          hasMultipleSubdomains: false,
          hasIPAddress: false,
          hasSuspiciousPort: false,
          hasURLEncoding: false,
          hasObfuscatedCharacters: false,
          hasExcessiveRedirects: false,
          hasHighEntropy: false,
          hasSuspiciousQuery: false,
          redirectionChain: resolution.redirectionChain,
          issues: ["Unresolvable shortlink"],
        },
        domainCharacteristics: {
          hasPunycode: false,
          hasSuspiciousTLD: false,
          hasExcessiveHyphens: false,
          lookalikeDomains: [],
          brandImpersonationDetected: false,
          impersonatedBrand: null,
          suspiciousKeywords: [],
          domainAge: null,
          issues: [],
        },
        threatIntelligence: {
          virusTotal: null,
          isKnownMalicious: false,
          suspiciousReports: 0,
          abuseScore: null,
        },
        riskBreakdown: {
          localHeuristicRisk: 40,
          urlStructuralRisk: 10,
          domainCharacteristicRisk: 15,
          pathQueryRisk: 0,
          threatIntelligenceRisk: 0,
          totalRisk: 65,
        },
        providerResults: {},
      };

      return NextResponse.json({
        success: true,
        type: "url",
        rawPayload: trimmedPayload,
        resolution,
        data: deadShortlinkAnalysis,
      });
    }

    // Step 5: Execute XEROVA URL Threat Analysis on Final Destination
    const targetUrl = resolution.finalUrl || normalizedUrl;
    const analysis = await analyzeURL(targetUrl);

    // Augment with redirect chain metrics
    analysis.urlCharacteristics.redirectionChain = resolution.redirectionChain;
    if (resolution.hopCount > 2) {
      analysis.urlCharacteristics.hasExcessiveRedirects = true;
      analysis.riskFactors.push({
        source: "Local URL Analysis",
        category: "Excessive Redirects",
        reason: `${resolution.hopCount} redirect hops traversed before reaching final destination (> 2 hops)`,
        severity: "MEDIUM",
        scoreContribution: 15,
      });
      analysis.findings.push({
        category: "URL Redirection",
        severity: "MEDIUM",
        description: `QR link bounced across ${resolution.hopCount} redirect hops (${resolution.redirectionChain.join(" ➔ ")}). Common technique to evade automated scanner crawlers.`,
      });

      // Elevate risk if previously clean
      analysis.riskScore = Math.min(100, analysis.riskScore + 15);
      if (analysis.verdict === "SAFE") {
        analysis.verdict = "SUSPICIOUS";
      }
    }

    // Log to ThreatSearch history
    const userId = session.user.id;
    if (userId) {
      connectDB()
        .then(() =>
          ThreatSearch.create({
            userId,
            query: targetUrl,
            type: "url",
            results: {
              ...analysis,
              rawPayload: trimmedPayload,
              redirectionChain: resolution.redirectionChain,
              hopCount: resolution.hopCount,
            },
            riskScore: analysis.riskScore,
            severity: analysis.severity || scoreToSeverity(analysis.riskScore),
            tags: ["QR Scanner", "Quishing", ...(analysis.sources || [])],
          })
        )
        .catch((err) => {
          console.error("[QR Scan] Failed to log search history:", err);
        });
    }

    return NextResponse.json({
      success: true,
      type: "url",
      rawPayload: trimmedPayload,
      resolution,
      data: analysis,
    });
  } catch (error) {
    console.error("[QR Scan API] Error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Internal server error analyzing QR payload" },
      { status: 500 }
    );
  }
}
