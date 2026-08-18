// ============================================
// XEROVA — URL Analysis Service
// ============================================
// Two-Layer URL Analysis Pipeline:
// Layer 1: Local URL Heuristics (brand impersonation, structure, entropy, path, query)
// Layer 2: External Threat Intelligence (VirusTotal, Criminal IP, AbuseIPDB, Abusix, Shodan)
// → Evidence Aggregator → Unified Risk Score & Risk Factors

import {
  vtLookupURL,
  vtLookupDomain,
  abuseIPDBLookup,
  criminalIPScanDomain,
  criminalIPLookupIP,
  abusixLookupIP,
  shodanLookupIP,
  shodanResolveDomain,
} from "./threat-apis";

import {
  parseURL,
  performLocalURLAnalysis,
  calculateUnifiedRiskScore,
  type URLAnalysisResult,
  type URLParseResult,
  type RiskFactor,
} from "./url-analyzer";

export async function analyzeURL(urlString: string): Promise<URLAnalysisResult> {
  // ---- Step 1: Parse URL ----
  const parsed = parseURL(urlString);

  if (parsed.error) {
    return {
      url: urlString,
      verdict: "SUSPICIOUS",
      riskScore: 50,
      threatLevel: "MEDIUM",
      severity: "medium",
      sources: ["Local URL Analysis"],
      riskFactors: [
        {
          source: "Local URL Analysis",
          category: "Parsing",
          reason: `Invalid or malformed URL structure: ${parsed.error}`,
          severity: "MEDIUM",
          scoreContribution: 50,
        },
      ],
      structural: {
        protocol: "unknown",
        domain: "",
        hostname: "",
        port: null,
        path: "",
        query: "",
        urlLength: urlString.length,
        subdominCount: 0,
        isIPBased: false,
        ipAddress: null,
        entropy: 0,
      },
      urlCharacteristics: {
        usesHTTPS: false,
        hasExcessiveLength: false,
        hasMultipleSubdomains: false,
        hasIPAddress: false,
        hasSuspiciousPort: false,
        hasURLEncoding: false,
        hasObfuscatedCharacters: false,
        hasExcessiveRedirects: false,
        hasHighEntropy: false,
        hasSuspiciousQuery: false,
        redirectionChain: [],
        issues: [parsed.error],
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
        criminalIP: null,
        abusix: null,
        abuseScore: null,
        isKnownMalicious: false,
        suspiciousReports: 0,
      },
      riskBreakdown: {
        localHeuristicRisk: 50,
        urlStructuralRisk: 50,
        domainCharacteristicRisk: 0,
        pathQueryRisk: 0,
        threatIntelligenceRisk: 0,
        totalRisk: 50,
      },
      findings: [
        {
          category: "URL Parsing",
          severity: "MEDIUM",
          description: `Failed to parse URL: ${parsed.error}`,
        },
      ],
    };
  }

  // ---- Step 2: Layer 1 — Local URL Heuristic Analysis ----
  const localAnalysis = performLocalURLAnalysis(parsed);

  // ---- Step 3: Layer 2 — External Threat Intelligence (Parallel Fetch) ----
  const threatIntelligence = await fetchThreatIntelligence(parsed, urlString);

  // ---- Step 4: Evidence Aggregation & Unified Risk Scoring ----
  const scoring = calculateUnifiedRiskScore(localAnalysis, threatIntelligence);

  // Compile combined findings
  const allFindings = [...localAnalysis.findings];

  if (threatIntelligence.virusTotal) {
    const { maliciousEngines, suspiciousEngines } = threatIntelligence.virusTotal;
    if (maliciousEngines > 0) {
      allFindings.push({
        category: "Threat Intelligence",
        severity: maliciousEngines >= 5 ? "CRITICAL" : "HIGH",
        description: `VirusTotal: Detected as malicious by ${maliciousEngines} security vendors.`,
      });
    }
    if (suspiciousEngines > 0) {
      allFindings.push({
        category: "Threat Intelligence",
        severity: "MEDIUM",
        description: `VirusTotal: Flagged as suspicious by ${suspiciousEngines} security vendors.`,
      });
    }
  }

  if (threatIntelligence.criminalIP?.riskScore || threatIntelligence.criminalIP?.phishingScore) {
    const phishing = threatIntelligence.criminalIP.phishingScore ?? 0;
    const malware = threatIntelligence.criminalIP.malwareScore ?? 0;
    if (phishing > 0 || malware > 0) {
      allFindings.push({
        category: "Threat Intelligence",
        severity: Math.max(phishing, malware) >= 70 ? "CRITICAL" : "HIGH",
        description: `Criminal IP: Phishing score ${phishing}%, Malware score ${malware}%.`,
      });
    }
  }

  if (threatIntelligence.abusix?.listed) {
    allFindings.push({
      category: "Threat Intelligence",
      severity: "CRITICAL",
      description: `Abusix: Domain/IP listed on threat intelligence blocklist (${threatIntelligence.abusix.threatLevel}).`,
    });
  }

  if (threatIntelligence.abuseScore && threatIntelligence.abuseScore > 20) {
    allFindings.push({
      category: "Threat Intelligence",
      severity: threatIntelligence.abuseScore > 60 ? "HIGH" : "MEDIUM",
      description: `AbuseIPDB: Abuse confidence score ${threatIntelligence.abuseScore}%.`,
    });
  }

  // Sort findings by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  allFindings.sort(
    (a, b) =>
      severityOrder[a.severity as keyof typeof severityOrder] -
      severityOrder[b.severity as keyof typeof severityOrder]
  );

  return {
    url: urlString,
    verdict: scoring.verdict,
    riskScore: scoring.totalScore,
    threatLevel: scoring.threatLevel,
    severity: scoring.severity,
    sources: scoring.sources,
    riskFactors: scoring.allRiskFactors,
    structural: {
      protocol: parsed.protocol,
      domain: parsed.domain,
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      query: parsed.query,
      urlLength: parsed.urlLength,
      subdominCount: parsed.subdomain ? parsed.subdomain.split(".").length : 0,
      isIPBased: parsed.isIPBased,
      ipAddress: parsed.ipAddress,
      entropy: parsed.entropy,
    },
    urlCharacteristics: localAnalysis.urlCharacteristics,
    domainCharacteristics: localAnalysis.domainCharacteristics,
    threatIntelligence,
    riskBreakdown: scoring.breakdown,
    findings: allFindings,
  };
}

interface ThreatIntelData {
  virusTotal: URLAnalysisResult["threatIntelligence"]["virusTotal"];
  criminalIP: URLAnalysisResult["threatIntelligence"]["criminalIP"];
  abusix: URLAnalysisResult["threatIntelligence"]["abusix"];
  abuseScore: number | null;
  isKnownMalicious: boolean;
  suspiciousReports: number;
}

async function fetchThreatIntelligence(
  parsed: URLParseResult,
  urlString: string
): Promise<ThreatIntelData> {
  const result: ThreatIntelData = {
    virusTotal: null,
    criminalIP: null,
    abusix: null,
    abuseScore: null,
    isKnownMalicious: false,
    suspiciousReports: 0,
  };

  // Run all threat intel queries concurrently with graceful degradation
  const queries: Promise<void>[] = [];

  // 1. VirusTotal URL Lookup
  queries.push(
    (async () => {
      try {
        const vtData = await vtLookupURL(urlString);
        if (vtData && typeof vtData === "object" && !("status" in vtData && vtData.status === "queued")) {
          const stats =
            ((vtData as Record<string, unknown>).lastAnalysisStats as Record<string, number>) ||
            ((vtData as Record<string, unknown>).last_analysis_stats as Record<string, number>) ||
            {};
          const malicious = stats.malicious || 0;
          const suspicious = stats.suspicious || 0;
          const harmless = stats.harmless || 0;
          const undetected = stats.undetected || 0;

          result.virusTotal = {
            reputation: ((vtData as Record<string, unknown>).reputation as number) || 0,
            maliciousEngines: malicious,
            suspiciousEngines: suspicious,
            harmlessEngines: harmless,
            undetectedEngines: undetected,
            lastAnalysisDate:
              ((vtData as Record<string, unknown>).lastAnalysisDate as string) || null,
            categories:
              ((vtData as Record<string, unknown>).categories as Record<string, string>) || {},
          };

          if (malicious > 0) {
            result.isKnownMalicious = true;
            result.suspiciousReports += malicious;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] VT URL lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 2. VirusTotal Domain Lookup (if not IP-based)
  if (!parsed.isIPBased && parsed.domain) {
    queries.push(
      (async () => {
        try {
          const vtDomain = await vtLookupDomain(parsed.domain);
          if (vtDomain && typeof vtDomain === "object") {
            const categories = (vtDomain.categories as Record<string, string>) || {};
            const categoryValues = Object.values(categories);
            if (
              categoryValues.some((cat) => {
                const lower = String(cat).toLowerCase();
                return (
                  lower.includes("malware") ||
                  lower.includes("phishing") ||
                  lower.includes("trojan") ||
                  lower.includes("suspicious")
                );
              })
            ) {
              result.isKnownMalicious = true;
              result.suspiciousReports += 5;
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] VT Domain lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // 3. Criminal IP Scan / Lookup
  if (parsed.isIPBased && parsed.ipAddress) {
    queries.push(
      (async () => {
        try {
          const cipIP = await criminalIPLookupIP(parsed.ipAddress!);
          if (cipIP) {
            const inbound = (cipIP.inboundScore as Record<string, unknown>)?.score;
            const score = typeof inbound === "number" ? inbound : null;
            result.criminalIP = {
              riskScore: score,
              phishingScore: null,
              malwareScore: cipIP.maliciousCount > 0 ? 80 : null,
            };
            if (cipIP.maliciousCount > 0) {
              result.isKnownMalicious = true;
              result.suspiciousReports += cipIP.maliciousCount;
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] Criminal IP IP lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  } else if (parsed.domain) {
    queries.push(
      (async () => {
        try {
          const cipDomain = await criminalIPScanDomain(parsed.domain);
          if (cipDomain) {
            result.criminalIP = {
              riskScore: typeof cipDomain.riskScore === "number" ? cipDomain.riskScore : null,
              phishingScore:
                typeof cipDomain.phishingScore === "number" ? cipDomain.phishingScore : null,
              malwareScore:
                typeof cipDomain.malwareScore === "number" ? cipDomain.malwareScore : null,
              technologies: cipDomain.technologies,
            };
            if ((cipDomain.phishingScore && cipDomain.phishingScore > 50) || (cipDomain.malwareScore && cipDomain.malwareScore > 50)) {
              result.isKnownMalicious = true;
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] Criminal IP Domain lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // 4. AbuseIPDB Lookup (if IP-based)
  if (parsed.isIPBased && parsed.ipAddress) {
    queries.push(
      (async () => {
        try {
          const abuse = await abuseIPDBLookup(parsed.ipAddress!);
          if (abuse && typeof abuse.abuseConfidenceScore === "number") {
            result.abuseScore = abuse.abuseConfidenceScore;
            if (abuse.abuseConfidenceScore > 40) {
              result.isKnownMalicious = true;
              result.suspiciousReports += Math.round(abuse.abuseConfidenceScore / 20);
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] AbuseIPDB lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // 5. Abusix Lookup (if IP-based)
  if (parsed.isIPBased && parsed.ipAddress) {
    queries.push(
      (async () => {
        try {
          const abusix = await abusixLookupIP(parsed.ipAddress!);
          if (abusix && abusix.listed) {
            result.abusix = {
              listed: abusix.listed,
              threatLevel: abusix.threatLevel,
              categories: abusix.categories,
            };
            result.isKnownMalicious = true;
          }
        } catch (err) {
          console.error("[ThreatIntel] Abusix lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // Wait for all queries to settle safely
  await Promise.allSettled(queries);

  return result;
}

export async function generateURLAnalysisReport(
  analysis: URLAnalysisResult
): Promise<string> {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("                   URL SECURITY ANALYSIS REPORT");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("");

  lines.push(`🔗 URL Analyzed: ${analysis.url}`);
  lines.push("");

  const verdictEmoji = {
    SAFE: "✅",
    SUSPICIOUS: "⚠️",
    MALICIOUS: "🚨",
  }[analysis.verdict];

  lines.push(`${verdictEmoji} VERDICT: ${analysis.verdict}`);
  lines.push(`📊 Unified Risk Score: ${analysis.riskScore}/100 (${analysis.severity.toUpperCase()})`);
  lines.push(`🎯 Threat Level: ${analysis.threatLevel}`);
  lines.push(`🌐 Evidence Sources: ${analysis.sources.join(", ")}`);
  lines.push("");

  // Risk Factors
  if (analysis.riskFactors.length > 0) {
    lines.push("⚠️ KEY RISK FACTORS IDENTIFIED:");
    analysis.riskFactors.forEach((rf, i) => {
      const sevEmoji = {
        CRITICAL: "🚨",
        HIGH: "🔴",
        MEDIUM: "🟡",
        LOW: "ℹ️",
      }[rf.severity];
      lines.push(`  ${i + 1}. ${sevEmoji} [${rf.source}] ${rf.reason}`);
    });
    lines.push("");
  }

  // Risk Breakdown
  lines.push("📈 RISK BREAKDOWN:");
  lines.push(`  • Local Heuristic Risk: ${analysis.riskBreakdown.localHeuristicRisk}/100`);
  lines.push(`    - URL Structural: ${analysis.riskBreakdown.urlStructuralRisk}/25`);
  lines.push(`    - Domain & Brand: ${analysis.riskBreakdown.domainCharacteristicRisk}/40`);
  lines.push(`    - Path & Query: ${analysis.riskBreakdown.pathQueryRisk}/35`);
  lines.push(`  • Threat Intelligence Risk: ${analysis.riskBreakdown.threatIntelligenceRisk}/100`);
  lines.push("");

  // Structural Analysis
  lines.push("🔍 STRUCTURAL ANALYSIS:");
  lines.push(`  • Protocol: ${analysis.structural.protocol.toUpperCase()}`);
  lines.push(`  • Domain: ${analysis.structural.domain}`);
  lines.push(`  • Hostname: ${analysis.structural.hostname}`);
  lines.push(`  • Port: ${analysis.structural.port || "default"}`);
  lines.push(`  • URL Length: ${analysis.structural.urlLength} characters`);
  lines.push(`  • Subdomain Depth: ${analysis.structural.subdominCount}`);
  lines.push(`  • Entropy Score: ${analysis.structural.entropy}`);
  if (analysis.structural.isIPBased) {
    lines.push(`  • ⚠️ Direct IP Host: ${analysis.structural.ipAddress}`);
  }
  lines.push("");

  // Findings
  if (analysis.findings.length > 0) {
    lines.push("📋 DETAILED FINDINGS:");
    analysis.findings.forEach((finding, i) => {
      const severityEmoji = {
        LOW: "ℹ️",
        MEDIUM: "⚠️",
        HIGH: "🔴",
        CRITICAL: "🚨",
      }[finding.severity];
      lines.push(`  ${i + 1}. ${severityEmoji} [${finding.severity}] ${finding.category}: ${finding.description}`);
    });
    lines.push("");
  }

  // Recommendation
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("📌 RECOMMENDATION:");
  const recommendations = {
    SAFE: "This URL exhibits low risk and no active indicators of malicious intent. Standard caution applies.",
    SUSPICIOUS: "⚠️ Exercise high caution. Suspicious structural, brand, or query indicators detected. Do NOT enter credentials or download files.",
    MALICIOUS: "🚨 CRITICAL THREAT: Block access immediately. Evidence of active brand impersonation, credential harvesting, or vendor blacklisting.",
  };
  lines.push(`   ${recommendations[analysis.verdict]}`);
  lines.push("═══════════════════════════════════════════════════════════");

  return lines.join("\n");
}
