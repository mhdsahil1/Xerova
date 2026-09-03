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
  vtLookupIP,
  getVTKey,
  abuseIPDBLookup,
  getAbuseKey,
  criminalIPScanDomain,
  criminalIPLookupIP,
  getCriminalIPKey,
  abusixLookupIP,
  getAbusixKey,
  shodanLookupIP,
  getShodanKey,
  otxLookupURL,
  otxLookupDomain,
  getOTXKey,
  alphaMountainLookupURI,
  getAlphaKey,
  isAlphaMountainEnabled,
  urlqueryLookup,
  getUrlQueryKey,
  yandexSafeBrowsingLookup,
  getYandexKey,
  googleSafeBrowsingLookup,
  getGoogleSafeBrowsingKey,
  vxvaultLookupURL,
  ip2LocationLookup,
  ip2WhoisLookup,
  checkphishScanURL,
  getCheckPhishKey,
  urlscanLookup,
  getUrlscanKey,
  phishstatsLookupURL,
  getPhishStatsKey,
  cloudmersiveScanURL,
  getCloudmersiveKey,
  ipstackLookupIP,
  getIPStackKey,
} from "./threat-apis";

import {
  parseURL,
  performLocalURLAnalysis,
  calculateUnifiedRiskScore,
  classifyTarget,
  CLOUDMERSIVE_ERROR_STATUSES,
  CLOUDMERSIVE_THREAT_STATUSES,
  type URLAnalysisResult,
  type URLParseResult,
} from "./url-analyzer";

import type {
  NormalizedProviderResult,
  TargetClassification,
  AnalysisCoverage,
} from "@/types";

// Timeout helper with graceful abort
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("ETIMEDOUT: Request timed out after 12s"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function analyzeURL(urlString: string): Promise<URLAnalysisResult> {
  // ---- Step 1: Parse URL ----
  const parsed = parseURL(urlString);

  if (parsed.error) {
    const emptyCoverage: AnalysisCoverage = {
      totalRelevant: 0,
      responded: 0,
      threats: 0,
      clean: 0,
      errors: 0,
      timeouts: 0,
      unavailable: 0,
      unknown: 0,
      percentage: 0,
    };

    return {
      url: urlString,
      verdict: "SUSPICIOUS",
      riskScore: 50,
      threatLevel: "MEDIUM",
      severity: "medium",
      sources: [],
      riskFactors: [],
      targetType: "url",
      coverage: emptyCoverage,
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
        otx: null,
        alphaMountain: null,
        urlquery: null,
        abuseScore: null,
        isKnownMalicious: false,
        suspiciousReports: 0,
      },
      riskBreakdown: {
        localHeuristicRisk: 0,
        urlStructuralRisk: 0,
        domainCharacteristicRisk: 0,
        pathQueryRisk: 0,
        threatIntelligenceRisk: 0,
        totalRisk: 0,
      },
      findings: [
        {
          category: "URL Parsing",
          severity: "MEDIUM",
          description: `Failed to parse URL: ${parsed.error}`,
        },
      ],
      providerResults: {},
    };
  }

  // ---- Step 2: Target Classification ----
  const targetType = classifyTarget(parsed);

  // ---- Step 3: Layer 1 — Local URL Heuristic Analysis ----
  const localAnalysis = performLocalURLAnalysis(parsed);

  // ---- Step 4: Layer 2 — External Threat Intelligence (Selective Routing) ----
  const { threatIntelData, providerResults } = await fetchThreatIntelligence(
    parsed,
    urlString,
    targetType
  );

  // ---- Step 5: Evidence Aggregation & Unified Risk Scoring ----
  const scoring = calculateUnifiedRiskScore(
    localAnalysis,
    threatIntelData,
    providerResults
  );

  // Compile combined findings (external threat intelligence engines only)
  const allFindings: Array<{
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
  }> = [];
  const pResults = scoring.providerResults;

  if (pResults["VirusTotal"]?.status === "threat") {
    const vt = threatIntelData.virusTotal;
    if (vt && vt.maliciousEngines > 0) {
      allFindings.push({
        category: "Threat Intelligence",
        severity: vt.maliciousEngines >= 5 ? "CRITICAL" : "HIGH",
        description: `VirusTotal: Detected as malicious by ${vt.maliciousEngines} security vendors.`,
      });
    } else if (vt && vt.suspiciousEngines > 0) {
      allFindings.push({
        category: "Threat Intelligence",
        severity: "MEDIUM",
        description: `VirusTotal: Flagged as suspicious by ${vt.suspiciousEngines} security vendors.`,
      });
    }
  }

  if (pResults["Criminal IP"]?.status === "threat") {
    const phishing = threatIntelData.criminalIP?.phishingScore ?? 0;
    const malware = threatIntelData.criminalIP?.malwareScore ?? 0;
    allFindings.push({
      category: "Threat Intelligence",
      severity: Math.max(phishing, malware) >= 70 ? "CRITICAL" : "HIGH",
      description: `Criminal IP: Phishing score ${phishing}%, Malware score ${malware}%.`,
    });
  }

  if (pResults["Abusix"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: "CRITICAL",
      description: `Abusix: Domain/IP listed on threat intelligence blocklist (${threatIntelData.abusix?.threatLevel}).`,
    });
  }

  if (pResults["AbuseIPDB"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: (threatIntelData.abuseScore || 0) > 60 ? "HIGH" : "MEDIUM",
      description: `AbuseIPDB: Abuse confidence score ${threatIntelData.abuseScore}%.`,
    });
  }

  if (pResults["alphaMountain.ai"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: (threatIntelData.alphaMountain?.riskScore || 0) >= 70 ? "CRITICAL" : "HIGH",
      description: `alphaMountain AI: Threat rating ${threatIntelData.alphaMountain?.threatScore.toFixed(2)}/5.0 (${threatIntelData.alphaMountain?.riskScore}% risk).`,
    });
  }

  if (threatIntelData.ip2whois && typeof threatIntelData.ip2whois.domainAge === "number") {
    if (threatIntelData.ip2whois.domainAge < 30) {
      allFindings.push({
        category: "Domain Intelligence",
        severity: "HIGH",
        description: `IP2WHOIS: Newly registered domain created only ${threatIntelData.ip2whois.domainAge} day(s) ago.`,
      });
    } else if (threatIntelData.ip2whois.domainAge < 90) {
      allFindings.push({
        category: "Domain Intelligence",
        severity: "MEDIUM",
        description: `IP2WHOIS: Domain created recently (${threatIntelData.ip2whois.domainAge} days ago).`,
      });
    }
  }

  if (threatIntelData.ip2location?.isProxy) {
    allFindings.push({
      category: "Network Intelligence",
      severity: "MEDIUM",
      description: `IP2Location: Host IP is identified as an active Proxy / VPN / Anonymizer node.`,
    });
  }

  if (pResults["CheckPhish.ai"]?.status === "threat") {
    const cp = threatIntelData.checkphish;
    allFindings.push({
      category: "AI Threat Intelligence",
      severity: cp?.disposition === "phish" ? "CRITICAL" : "HIGH",
      description: `CheckPhish AI: ${cp?.disposition === "phish" ? `Verified phishing attack${cp?.brand ? ` impersonating ${cp.brand}` : ""}` : "Suspicious site behavior identified by visual and neural models."}`,
    });
  }

  if (pResults["urlscan.io"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: "CRITICAL",
      description: `urlscan.io: Sandbox verdict classified page as malicious (Score: ${threatIntelData.urlscan?.score}/100).`,
    });
  }

  if (pResults["PhishStats"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: (threatIntelData.phishstats?.score || 0) >= 7 ? "CRITICAL" : "HIGH",
      description: `PhishStats: Real-time phishing index score ${threatIntelData.phishstats?.score.toFixed(1)}/10.0${threatIntelData.phishstats?.targetBrand ? ` targeting ${threatIntelData.phishstats.targetBrand}` : ""}.`,
    });
  }

  if (pResults["Cloudmersive"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: "CRITICAL",
      description: `Cloudmersive: Anti-malware scanner detected threat (${threatIntelData.cloudmersive?.websiteThreatType || "Malicious code detected"}).`,
    });
  }

  if (pResults["Google Safe Browsing"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: "CRITICAL",
      description: `Google Safe Browsing: Listed on Google threat index (${threatIntelData.googleSafeBrowsing?.threatTypes.join(", ") || "Threat match"}).`,
    });
  }

  if (pResults["IPStack"]?.status === "threat") {
    allFindings.push({
      category: "Network Intelligence",
      severity: "HIGH",
      description: `IPStack: High risk security threat level detected on host server infrastructure.`,
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
    targetType,
    coverage: scoring.coverage,
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
    threatIntelligence: threatIntelData,
    riskBreakdown: scoring.breakdown,
    findings: allFindings,
    timestamp: new Date().toISOString(),
    providerResults: scoring.providerResults,
  };
}

interface ThreatIntelData {
  virusTotal: URLAnalysisResult["threatIntelligence"]["virusTotal"];
  criminalIP: URLAnalysisResult["threatIntelligence"]["criminalIP"];
  abusix: URLAnalysisResult["threatIntelligence"]["abusix"];
  otx: URLAnalysisResult["threatIntelligence"]["otx"];
  alphaMountain: URLAnalysisResult["threatIntelligence"]["alphaMountain"];
  urlquery: URLAnalysisResult["threatIntelligence"]["urlquery"];
  yandex: URLAnalysisResult["threatIntelligence"]["yandex"];
  vxvault: URLAnalysisResult["threatIntelligence"]["vxvault"];
  checkphish: URLAnalysisResult["threatIntelligence"]["checkphish"];
  urlscan: URLAnalysisResult["threatIntelligence"]["urlscan"];
  phishstats: URLAnalysisResult["threatIntelligence"]["phishstats"];
  cloudmersive: URLAnalysisResult["threatIntelligence"]["cloudmersive"];
  googleSafeBrowsing?: URLAnalysisResult["threatIntelligence"]["googleSafeBrowsing"];
  ipstack?: URLAnalysisResult["threatIntelligence"]["ipstack"];
  ip2whois?: { domainAge: number | null; registrar: string; createDate: string } | null;
  ip2location?: { countryName: string; cityName: string; isProxy: boolean } | null;
  abuseScore: number | null;
  isKnownMalicious: boolean;
  suspiciousReports: number;
}

async function fetchThreatIntelligence(
  parsed: URLParseResult,
  urlString: string,
  targetType: TargetClassification
): Promise<{
  threatIntelData: ThreatIntelData;
  providerResults: Record<string, NormalizedProviderResult>;
}> {
  const data: ThreatIntelData = {
    virusTotal: null,
    criminalIP: null,
    abusix: null,
    otx: null,
    alphaMountain: null,
    urlquery: null,
    yandex: null,
    vxvault: null,
    checkphish: null,
    urlscan: null,
    phishstats: null,
    cloudmersive: null,
    googleSafeBrowsing: null,
    ipstack: null,
    ip2whois: null,
    ip2location: null,
    abuseScore: null,
    isKnownMalicious: false,
    suspiciousReports: 0,
  };

  const providerResults: Record<string, NormalizedProviderResult> = {};
  const queries: Promise<void>[] = [];

  // Helper for registering error / timeout states
  const recordFailure = (
    provider: string,
    err: unknown,
    relevance: "exact" | "domain" | "related" | "historical" = "exact"
  ) => {
    const msg = (err as Error)?.message || "";
    const isTimeout =
      msg.includes("ETIMEDOUT") ||
      msg.includes("timeout") ||
      msg.includes("aborted") ||
      msg.includes("AbortError");

    providerResults[provider] = {
      provider,
      status: isTimeout ? "timeout" : "error",
      error: isTimeout ? "Request timed out after 12s" : msg || "Provider query failed",
      evidence: [],
      scoreContribution: 0,
      relevance,
    };
  };

  // Helper for registering unavailable engines
  const markUnavailable = (provider: string, reason = "API key not configured in environment") => {
    providerResults[provider] = {
      provider,
      status: "unavailable",
      error: reason,
      evidence: [],
      scoreContribution: 0,
    };
  };

  // ============================================================
  // 1. VirusTotal
  // Relevance: URL, Domain, IP
  // ============================================================
  if (!getVTKey()) {
    markUnavailable("VirusTotal", "VIRUSTOTAL_API_KEY is not configured");
  } else {
    queries.push(
      (async () => {
        try {
          if (targetType === "ip" && parsed.ipAddress) {
            const vtIP = await withTimeout(vtLookupIP(parsed.ipAddress));
            if (vtIP && typeof vtIP === "object") {
              const stats = (vtIP.lastAnalysisStats as Record<string, number>) || {};
              const malicious = stats.malicious || 0;
              const suspicious = stats.suspicious || 0;
              const harmless = stats.harmless || 0;
              const undetected = stats.undetected || 0;
              const rep = typeof vtIP.reputation === "number" ? vtIP.reputation : 0;

              data.virusTotal = {
                reputation: rep,
                maliciousEngines: malicious,
                suspiciousEngines: suspicious,
                harmlessEngines: harmless,
                undetectedEngines: undetected,
                lastAnalysisDate: (vtIP.lastAnalysisDate as string) || null,
                categories: {},
              };

              const isThreat = malicious > 0 || suspicious > 0 || rep < -20;
              const score = malicious > 0
                ? Math.min(50, malicious * 10 + suspicious * 3)
                : suspicious > 0
                  ? 20
                  : rep < -20
                    ? Math.min(40, Math.abs(rep))
                    : 0;

              providerResults["VirusTotal"] = {
                provider: "VirusTotal",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [
                      `Flagged as malicious by ${malicious} security vendor${malicious > 1 ? "s" : ""}`,
                      `Harmless: ${harmless}, Undetected: ${undetected}`,
                    ]
                  : [`Clean host IP reputation: 0 / ${harmless + undetected} vendors flagged malicious`],
                scoreContribution: score,
                relevance: "exact",
                details: {
                  malicious,
                  suspicious,
                  harmless,
                  undetected,
                  reputation: rep,
                  scanDate: vtIP.lastAnalysisDate,
                },
              };

              if (malicious > 0) {
                data.isKnownMalicious = true;
                data.suspiciousReports += malicious;
              }
            } else {
              providerResults["VirusTotal"] = {
                provider: "VirusTotal",
                status: "clean",
                evidence: ["No security vendor detections returned"],
                scoreContribution: 0,
                relevance: "exact",
              };
            }
          } else {
            // URL or Domain lookup
            const vtData = await withTimeout(vtLookupURL(urlString));
            if (vtData && typeof vtData === "object" && !("status" in vtData && vtData.status === "queued")) {
              const stats =
                ((vtData as Record<string, unknown>).lastAnalysisStats as Record<string, number>) ||
                ((vtData as Record<string, unknown>).last_analysis_stats as Record<string, number>) ||
                {};
              const malicious = stats.malicious || 0;
              const suspicious = stats.suspicious || 0;
              const harmless = stats.harmless || 0;
              const undetected = stats.undetected || 0;
              const rep = ((vtData as Record<string, unknown>).reputation as number) || 0;

              data.virusTotal = {
                reputation: rep,
                maliciousEngines: malicious,
                suspiciousEngines: suspicious,
                harmlessEngines: harmless,
                undetectedEngines: undetected,
                lastAnalysisDate: ((vtData as Record<string, unknown>).lastAnalysisDate as string) || null,
                categories: ((vtData as Record<string, unknown>).categories as Record<string, string>) || {},
              };

              const isThreat = malicious > 0 || suspicious > 0 || rep < -20;
              const score = malicious > 0
                ? Math.min(50, malicious * 10 + suspicious * 3)
                : suspicious > 0
                  ? 20
                  : rep < -20
                    ? Math.min(40, Math.abs(rep))
                    : 0;

              providerResults["VirusTotal"] = {
                provider: "VirusTotal",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [
                      `Flagged as malicious by ${malicious} security vendor${malicious > 1 ? "s" : ""}`,
                      `Harmless: ${harmless}, Undetected: ${undetected}${suspicious > 0 ? `, Suspicious: ${suspicious}` : ""}`,
                    ]
                  : [`Clean vendor reputation: 0 / ${harmless + undetected} vendors flagged malicious`],
                scoreContribution: score,
                relevance: "exact",
                details: {
                  malicious,
                  suspicious,
                  harmless,
                  undetected,
                  reputation: rep,
                  scanDate: data.virusTotal.lastAnalysisDate,
                },
              };

              if (malicious > 0) {
                data.isKnownMalicious = true;
                data.suspiciousReports += malicious;
              }
            } else if (vtData && typeof vtData === "object" && "status" in vtData && vtData.status === "queued") {
              providerResults["VirusTotal"] = {
                provider: "VirusTotal",
                status: "unknown",
                evidence: ["URL queued for scanning on VirusTotal; scan in progress"],
                scoreContribution: 0,
                relevance: "exact",
              };
            } else if (parsed.domain) {
              // Fallback to domain lookup
              const vtDomain = await withTimeout(vtLookupDomain(parsed.domain));
              if (vtDomain && typeof vtDomain === "object") {
                const stats = (vtDomain.lastAnalysisStats as Record<string, number>) || {};
                const malicious = stats.malicious || 0;
                const rep = (vtDomain.reputation as number) || 0;

                data.virusTotal = {
                  reputation: rep,
                  maliciousEngines: malicious,
                  suspiciousEngines: stats.suspicious || 0,
                  harmlessEngines: stats.harmless || 0,
                  undetectedEngines: stats.undetected || 0,
                  lastAnalysisDate: (vtDomain.lastUpdateDate as string) || null,
                  categories: (vtDomain.categories as Record<string, string>) || {},
                };

                const isThreat = malicious > 0 || rep < -20;
                providerResults["VirusTotal"] = {
                  provider: "VirusTotal",
                  status: isThreat ? "threat" : "clean",
                  evidence: isThreat
                    ? [`Domain flagged as malicious by ${malicious} security vendor${malicious > 1 ? "s" : ""}`]
                    : [`Domain reputation clean across security vendors`],
                  scoreContribution: isThreat ? Math.min(45, malicious * 10) : 0,
                  relevance: "domain",
                  details: {
                    malicious,
                    reputation: rep,
                  },
                };
              } else {
                providerResults["VirusTotal"] = {
                  provider: "VirusTotal",
                  status: "clean",
                  evidence: ["No vendor flags detected on target"],
                  scoreContribution: 0,
                  relevance: "exact",
                };
              }
            } else {
              providerResults["VirusTotal"] = {
                provider: "VirusTotal",
                status: "clean",
                evidence: ["No vendor flags detected on target"],
                scoreContribution: 0,
                relevance: "exact",
              };
            }
          }
        } catch (err) {
          recordFailure("VirusTotal", err);
        }
      })()
    );
  }

  // ============================================================
  // 3. Criminal IP
  // Relevance: Domain, IP
  // ============================================================
  if (targetType === "ip" || targetType === "domain" || parsed.domain) {
    if (!getCriminalIPKey()) {
      markUnavailable("Criminal IP", "CRIMINAL_IP_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            if (targetType === "ip" && parsed.ipAddress) {
              const cipIP = await withTimeout(criminalIPLookupIP(parsed.ipAddress));
              if (cipIP) {
                const inbound = (cipIP.inboundScore as Record<string, unknown>)?.score;
                const score = typeof inbound === "number" ? inbound : null;
                data.criminalIP = {
                  riskScore: score,
                  phishingScore: null,
                  malwareScore: cipIP.maliciousCount > 0 ? 80 : null,
                };

                const isThreat = cipIP.maliciousCount > 0;
                providerResults["Criminal IP"] = {
                  provider: "Criminal IP",
                  status: isThreat ? "threat" : "clean",
                  evidence: isThreat
                    ? [`Host IP flagged with ${cipIP.maliciousCount} malicious indicators`]
                    : ["Clean IP infrastructure assessment"],
                  scoreContribution: isThreat ? 75 : 0,
                  relevance: "exact",
                  details: {
                    riskScore: score,
                    maliciousCount: cipIP.maliciousCount,
                  },
                };

                if (cipIP.maliciousCount > 0) {
                  data.isKnownMalicious = true;
                  data.suspiciousReports += cipIP.maliciousCount;
                }
              } else {
                providerResults["Criminal IP"] = {
                  provider: "Criminal IP",
                  status: "clean",
                  evidence: ["Clean threat assessment"],
                  scoreContribution: 0,
                };
              }
            } else if (parsed.domain) {
              const cipDomain = await withTimeout(criminalIPScanDomain(parsed.domain));
              if (cipDomain) {
                const phishing = typeof cipDomain.phishingScore === "number" ? cipDomain.phishingScore : 0;
                const malware = typeof cipDomain.malwareScore === "number" ? cipDomain.malwareScore : 0;
                const cipMax = Math.max(phishing, malware);

                data.criminalIP = {
                  riskScore: typeof cipDomain.riskScore === "number" ? cipDomain.riskScore : null,
                  phishingScore: phishing > 0 ? phishing : null,
                  malwareScore: malware > 0 ? malware : null,
                  technologies: cipDomain.technologies,
                };

                if (cipMax > 0) {
                  providerResults["Criminal IP"] = {
                    provider: "Criminal IP",
                    status: "threat",
                    evidence: [
                      `Risk assessment: ${phishing > 0 ? `Phishing ${phishing}%` : `Malware ${malware}%`}`,
                      ...(cipDomain.technologies && cipDomain.technologies.length > 0
                        ? [`Technologies: ${cipDomain.technologies.slice(0, 4).join(", ")}`]
                        : []),
                    ],
                    scoreContribution: cipMax,
                    relevance: "domain",
                    details: {
                      riskScore: cipDomain.riskScore,
                      phishingScore: phishing,
                      malwareScore: malware,
                      technologies: cipDomain.technologies,
                    },
                  };

                  if (phishing > 50 || malware > 50) {
                    data.isKnownMalicious = true;
                  }
                } else {
                  providerResults["Criminal IP"] = {
                    provider: "Criminal IP",
                    status: "clean",
                    evidence: ["Clean domain assessment (0% phishing, 0% malware)"],
                    scoreContribution: 0,
                    relevance: "domain",
                    details: { phishingScore: 0, malwareScore: 0, riskScore: cipDomain.riskScore ?? 0 },
                  };
                }
              } else {
                providerResults["Criminal IP"] = {
                  provider: "Criminal IP",
                  status: "clean",
                  evidence: ["Clean assessment"],
                  scoreContribution: 0,
                };
              }
            }
          } catch (err) {
            recordFailure("Criminal IP", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 4. AbuseIPDB
  // Relevance: IP
  // ============================================================
  if (targetType === "ip" && parsed.ipAddress) {
    if (!getAbuseKey()) {
      markUnavailable("AbuseIPDB", "ABUSEIPDB_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const abuse = await withTimeout(abuseIPDBLookup(parsed.ipAddress!));
            if (abuse && typeof abuse.abuseConfidenceScore === "number") {
              data.abuseScore = abuse.abuseConfidenceScore;
              const isThreat = abuse.abuseConfidenceScore >= 25;

              providerResults["AbuseIPDB"] = {
                provider: "AbuseIPDB",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [`Abuse confidence score: ${abuse.abuseConfidenceScore}% from community reports`]
                  : [`Clean IP reputation: ${abuse.abuseConfidenceScore}% abuse confidence (below threshold)`],
                scoreContribution: isThreat ? abuse.abuseConfidenceScore : 0,
                relevance: "exact",
                details: {
                  abuseConfidenceScore: abuse.abuseConfidenceScore,
                  totalReports: abuse.totalReports,
                  countryName: abuse.countryName,
                },
              };

              if (abuse.abuseConfidenceScore > 40) {
                data.isKnownMalicious = true;
                data.suspiciousReports += Math.round(abuse.abuseConfidenceScore / 20);
              }
            } else {
              providerResults["AbuseIPDB"] = {
                provider: "AbuseIPDB",
                status: "clean",
                evidence: ["Clean IP report"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("AbuseIPDB", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 5. Abusix
  // Relevance: IP
  // ============================================================
  if (targetType === "ip" && parsed.ipAddress) {
    if (!getAbusixKey()) {
      markUnavailable("Abusix", "ABUSIX_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const abusix = await withTimeout(abusixLookupIP(parsed.ipAddress!));
            if (abusix && abusix.listed) {
              data.abusix = {
                listed: abusix.listed,
                threatLevel: abusix.threatLevel,
                categories: abusix.categories,
              };
              data.isKnownMalicious = true;

              providerResults["Abusix"] = {
                provider: "Abusix",
                status: "threat",
                evidence: [
                  `Listed on Abusix threat intelligence blocklist (${abusix.threatLevel})`,
                  ...(abusix.categories && abusix.categories.length > 0 ? [`Categories: ${abusix.categories.join(", ")}`] : []),
                ],
                scoreContribution: 75,
                relevance: "exact",
                details: {
                  listed: abusix.listed,
                  threatLevel: abusix.threatLevel,
                  categories: abusix.categories,
                },
              };
            } else {
              providerResults["Abusix"] = {
                provider: "Abusix",
                status: "clean",
                evidence: ["Host IP is not listed on any Abusix threat blocklists"],
                scoreContribution: 0,
                details: { listed: false },
              };
            }
          } catch (err) {
            recordFailure("Abusix", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 6. alphaMountain.ai
  // Relevance: URL, Domain (only if configured and enabled)
  // ============================================================
  if ((targetType === "url" || targetType === "domain") && isAlphaMountainEnabled() && getAlphaKey()) {
    queries.push(
      (async () => {
        try {
          const target = parsed.domain || urlString;
          const alphaData = await withTimeout(alphaMountainLookupURI(target));
          if (alphaData) {
            const riskScore = (alphaData.riskScore as number) || 0;
            const threatScore = (alphaData.threatScore as number) || 0;
            data.alphaMountain = {
              threatScore,
              riskScore,
              categories: (alphaData.categories as number[]) || [],
              confidence: (alphaData.confidence as number) || 0,
              source: alphaData.source as string,
            };

            const isThreat = riskScore >= 25;
            providerResults["alphaMountain.ai"] = {
              provider: "alphaMountain.ai",
              status: isThreat ? "threat" : "clean",
              evidence: isThreat
                ? [`AI threat rating: ${threatScore.toFixed(2)}/5.0 (${riskScore}% risk score)`]
                : [`Low AI risk score (${riskScore}%, rating: ${threatScore.toFixed(2)}/5.0)`],
              scoreContribution: isThreat ? riskScore : 0,
              relevance: targetType === "url" ? "exact" : "domain",
              details: {
                threatScore,
                riskScore,
                confidence: alphaData.confidence,
              },
            };

            if (riskScore >= 50) {
              data.isKnownMalicious = true;
            }
          }
        } catch (err) {
          recordFailure("alphaMountain.ai", err);
        }
      })()
    );
  }

  // ============================================================
  // 7. CheckPhish.ai
  // Relevance: URL, Domain
  // ============================================================
  if (targetType === "url" || targetType === "domain") {
    if (!getCheckPhishKey()) {
      markUnavailable("CheckPhish.ai", "CHECKPHISH_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const cpData = await withTimeout(checkphishScanURL(urlString));
            if (cpData) {
              data.checkphish = {
                disposition: cpData.disposition,
                brand: cpData.brand,
                insights: cpData.insights,
                screenshotUrl: cpData.screenshotUrl,
              };

              if (cpData.disposition === "phish") {
                data.isKnownMalicious = true;
                data.suspiciousReports += 8;
                providerResults["CheckPhish.ai"] = {
                  provider: "CheckPhish.ai",
                  status: "threat",
                  evidence: [
                    `AI neural model classified URL as active Phishing${cpData.brand ? ` (Target: ${cpData.brand})` : ""}`,
                    ...(cpData.insights ? [cpData.insights] : []),
                  ],
                  scoreContribution: 85,
                  relevance: "exact",
                  details: {
                    disposition: cpData.disposition,
                    brand: cpData.brand,
                    insights: cpData.insights,
                    screenshotUrl: cpData.screenshotUrl,
                  },
                };
              } else if (cpData.disposition === "suspicious") {
                providerResults["CheckPhish.ai"] = {
                  provider: "CheckPhish.ai",
                  status: "threat",
                  evidence: ["AI neural model flagged URL as suspicious behavior"],
                  scoreContribution: 60,
                  relevance: "exact",
                  details: {
                    disposition: cpData.disposition,
                    brand: cpData.brand,
                    insights: cpData.insights,
                    screenshotUrl: cpData.screenshotUrl,
                  },
                };
              } else if (cpData.disposition === "clean") {
                providerResults["CheckPhish.ai"] = {
                  provider: "CheckPhish.ai",
                  status: "clean",
                  evidence: ["AI neural model confirmed clean disposition"],
                  scoreContribution: 0,
                  details: { disposition: "clean" },
                };
              } else {
                providerResults["CheckPhish.ai"] = {
                  provider: "CheckPhish.ai",
                  status: "unknown",
                  evidence: ["Scan response was inconclusive or pending analysis"],
                  scoreContribution: 0,
                  details: { disposition: cpData.disposition },
                };
              }
            } else {
              providerResults["CheckPhish.ai"] = {
                provider: "CheckPhish.ai",
                status: "clean",
                evidence: ["Clean site disposition"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("CheckPhish.ai", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 8. urlscan.io
  // Relevance: URL, Domain
  // ============================================================
  if (targetType === "url" || targetType === "domain") {
    if (!getUrlscanKey()) {
      markUnavailable("urlscan.io", "URLSCAN_IO_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const usData = await withTimeout(urlscanLookup(urlString));
            if (usData) {
              data.urlscan = {
                score: usData.score,
                malicious: usData.malicious,
                categories: usData.categories,
                technologies: usData.technologies,
                screenshotUrl: usData.screenshotUrl,
                reportUrl: usData.reportUrl,
              };

              const isThreat = usData.malicious || usData.score >= 50;
              const score = isThreat ? Math.max(75, usData.score) : 0;

              providerResults["urlscan.io"] = {
                provider: "urlscan.io",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [
                      `Automated sandbox flagged target as malicious (Score: ${usData.score}/100)`,
                      ...(usData.technologies && usData.technologies.length > 0
                        ? [`Technologies: ${usData.technologies.slice(0, 4).join(", ")}`]
                        : []),
                    ]
                  : [`Sandbox analysis clean (Score: ${usData.score}/100)`],
                scoreContribution: score,
                relevance: "exact",
                details: {
                  score: usData.score,
                  malicious: usData.malicious,
                  technologies: usData.technologies,
                  screenshotUrl: usData.screenshotUrl,
                  reportUrl: usData.reportUrl,
                },
              };

              if (isThreat) {
                data.isKnownMalicious = true;
                data.suspiciousReports += 6;
              }
            } else {
              providerResults["urlscan.io"] = {
                provider: "urlscan.io",
                status: "clean",
                evidence: ["Sandbox scan clean"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("urlscan.io", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 9. PhishStats
  // Relevance: URL (phishing links)
  // ============================================================
  if (targetType === "url") {
    if (!getPhishStatsKey()) {
      markUnavailable("PhishStats", "PHISHSTATS_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const psData = await withTimeout(phishstatsLookupURL(urlString));
            if (psData) {
              data.phishstats = {
                score: psData.score,
                tags: psData.tags,
                targetBrand: psData.targetBrand,
                threatType: psData.threatType,
              };

              const isThreat = psData.score >= 4;
              const score = isThreat ? Math.min(100, Math.round(psData.score * 10)) : 0;

              providerResults["PhishStats"] = {
                provider: "PhishStats",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [
                      `Phishing threat rating: ${psData.score.toFixed(1)}/10.0${psData.targetBrand ? ` targeting ${psData.targetBrand}` : ""}`,
                      ...(psData.tags && psData.tags.length > 0 ? [`Tags: ${psData.tags.slice(0, 3).join(", ")}`] : []),
                    ]
                  : ["Target not listed in live phishing feeds"],
                scoreContribution: score,
                relevance: "exact",
                details: {
                  score: psData.score,
                  tags: psData.tags,
                  targetBrand: psData.targetBrand,
                  threatType: psData.threatType,
                },
              };

              if (psData.score >= 5) {
                data.isKnownMalicious = true;
                data.suspiciousReports += Math.round(psData.score);
              }
            } else {
              providerResults["PhishStats"] = {
                provider: "PhishStats",
                status: "clean",
                evidence: ["Not found in live phishing index"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("PhishStats", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 10. Cloudmersive
  // Relevance: URL, Domain, IP
  // ============================================================
  if (!getCloudmersiveKey()) {
    markUnavailable("Cloudmersive", "CLOUDMERSIVE_API_KEY is not configured");
  } else {
    queries.push(
      (async () => {
        try {
          const cmData = await withTimeout(cloudmersiveScanURL(urlString));
          if (cmData) {
            data.cloudmersive = {
              cleanResult: cmData.cleanResult,
              websiteThreatType: cmData.websiteThreatType,
              foundViruses: cmData.foundViruses,
            };

            const rawType = (cmData.websiteThreatType || "").trim();
            const typeLower = rawType.toLowerCase();
            const isError = CLOUDMERSIVE_ERROR_STATUSES.has(typeLower);
            const isThreat =
              !isError &&
              ((cmData.foundViruses && cmData.foundViruses.length > 0) ||
                CLOUDMERSIVE_THREAT_STATUSES.has(typeLower));

            if (isError) {
              providerResults["Cloudmersive"] = {
                provider: "Cloudmersive",
                status: "error",
                error: rawType || "Unable to connect to target server",
                evidence: [],
                scoreContribution: 0,
                details: { websiteThreatType: rawType },
              };
            } else if (isThreat) {
              const virusList = (cmData.foundViruses || []).map((v) => v.virusName).filter(Boolean).join(", ");
              providerResults["Cloudmersive"] = {
                provider: "Cloudmersive",
                status: "threat",
                evidence: [
                  virusList
                    ? `Anti-virus scanner detected viruses: ${virusList}`
                    : `Threat detection identified: ${rawType}`,
                ],
                scoreContribution: 80,
                relevance: "exact",
                details: {
                  websiteThreatType: rawType,
                  foundViruses: cmData.foundViruses,
                },
              };
              data.isKnownMalicious = true;
              data.suspiciousReports += 7;
            } else if (cmData.cleanResult === true || typeLower === "none" || typeLower === "") {
              providerResults["Cloudmersive"] = {
                provider: "Cloudmersive",
                status: "clean",
                evidence: ["Clean anti-virus and web threat scan (0 viruses found)"],
                scoreContribution: 0,
                relevance: "exact",
                details: { cleanResult: true, websiteThreatType: "None" },
              };
            } else {
              providerResults["Cloudmersive"] = {
                provider: "Cloudmersive",
                status: "unknown",
                error: rawType,
                evidence: [`Indeterminate response: ${rawType}`],
                scoreContribution: 0,
                details: { websiteThreatType: rawType },
              };
            }
          } else {
            providerResults["Cloudmersive"] = {
              provider: "Cloudmersive",
              status: "clean",
              evidence: ["Clean anti-malware scan"],
              scoreContribution: 0,
            };
          }
        } catch (err) {
          recordFailure("Cloudmersive", err);
        }
      })()
    );
  }

  // ============================================================
  // 11. Yandex Safe Browsing
  // Relevance: URL
  // ============================================================
  if (targetType === "url") {
    if (!getYandexKey()) {
      markUnavailable("Yandex Safe Browsing", "YANDEX_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const yandexData = await withTimeout(yandexSafeBrowsingLookup(urlString));
            if (yandexData) {
              data.yandex = yandexData;
              const isThreat = !yandexData.isSafe && yandexData.matches.length > 0;
              const types = yandexData.matches.map((m) => m.threatType).join(", ");

              providerResults["Yandex Safe Browsing"] = {
                provider: "Yandex Safe Browsing",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [`Flagged as unsafe by Yandex Safe Browsing: ${types}`]
                  : ["No malware or phishing matches in Yandex threat index"],
                scoreContribution: isThreat ? 80 : 0,
                relevance: "exact",
                details: { isSafe: yandexData.isSafe, matches: yandexData.matches },
              };

              if (isThreat) {
                data.isKnownMalicious = true;
                data.suspiciousReports += 5;
              }
            } else {
              providerResults["Yandex Safe Browsing"] = {
                provider: "Yandex Safe Browsing",
                status: "clean",
                evidence: ["Clean reputation in search safety index"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("Yandex Safe Browsing", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 12. Google Safe Browsing
  // Relevance: URL, Domain
  // ============================================================
  if (targetType === "url" || targetType === "domain") {
    if (!getGoogleSafeBrowsingKey()) {
      markUnavailable("Google Safe Browsing", "GOOGLE_SAFE_BROWSING_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const gsbData = await withTimeout(googleSafeBrowsingLookup(urlString));
            if (gsbData) {
              data.googleSafeBrowsing = gsbData;
              const isThreat = gsbData.isThreat && gsbData.threatTypes.length > 0;
              const types = gsbData.threatTypes.join(", ");

              providerResults["Google Safe Browsing"] = {
                provider: "Google Safe Browsing",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [`Flagged as unsafe on Google Safe Browsing: ${types}`]
                  : ["No malware, social engineering, or harmful matches on Google Safe Browsing"],
                scoreContribution: isThreat ? 85 : 0,
                relevance: "exact",
                details: { isSafe: gsbData.isSafe, isThreat: gsbData.isThreat, threatTypes: gsbData.threatTypes, platformTypes: gsbData.platformTypes },
              };

              if (isThreat) {
                data.isKnownMalicious = true;
                data.suspiciousReports += 5;
              }
            } else {
              providerResults["Google Safe Browsing"] = {
                provider: "Google Safe Browsing",
                status: "clean",
                evidence: ["Clean reputation on Google Safe Browsing lists"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("Google Safe Browsing", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 13. VXVault Live Malware Feed
  // Relevance: URL (Public Live Feed)
  // ============================================================
  if (targetType === "url") {
    queries.push(
      (async () => {
        try {
          const vxData = await withTimeout(vxvaultLookupURL(urlString));
          if (vxData) {
            data.vxvault = vxData;
            providerResults["VXVault Threat Feed"] = {
              provider: "VXVault Threat Feed",
              status: vxData.listed ? "threat" : "clean",
              evidence: vxData.listed
                ? [`Actively listed on VXVault malware distribution feed${vxData.matchUrl ? ` (${vxData.matchUrl})` : ""}`]
                : ["Target not present in live malware distribution database"],
              scoreContribution: vxData.listed ? 85 : 0,
              relevance: "exact",
              details: { listed: vxData.listed, matchUrl: vxData.matchUrl },
            };

            if (vxData.listed) {
              data.isKnownMalicious = true;
              data.suspiciousReports += 10;
            }
          } else {
            providerResults["VXVault Threat Feed"] = {
              provider: "VXVault Threat Feed",
              status: "clean",
              evidence: ["Not found in live malware feeds"],
              scoreContribution: 0,
            };
          }
        } catch (err) {
          recordFailure("VXVault Threat Feed", err);
        }
      })()
    );
  }

  // ============================================================
  // 13. URLQuery
  // Relevance: URL, Domain
  // ============================================================
  if (targetType === "url" || targetType === "domain") {
    if (!getUrlQueryKey()) {
      markUnavailable("URLQuery", "URL_QUERY_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const target = parsed.domain || urlString;
            const uqData = await withTimeout(urlqueryLookup(target));
            if (uqData) {
              data.urlquery = {
                totalHits: (uqData.totalHits as number) || 0,
                reports: (uqData.reports as Array<{ id: string; url: string; status: string; date: string }>) || [],
              };

              providerResults["URLQuery"] = {
                provider: "URLQuery",
                status: "clean",
                evidence:
                  uqData.totalHits > 0
                    ? [`Found in ${uqData.totalHits} previous scan report(s)`]
                    : ["No previous malicious submissions found"],
                scoreContribution: 0,
                details: { totalHits: uqData.totalHits, reportsSample: (uqData.reports || []).slice(0, 3) },
              };
            } else {
              providerResults["URLQuery"] = {
                provider: "URLQuery",
                status: "clean",
                evidence: ["Clean sandbox history"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("URLQuery", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 14. IPStack
  // Relevance: IP
  // ============================================================
  if (targetType === "ip" && parsed.ipAddress) {
    if (!getIPStackKey()) {
      markUnavailable("IPStack", "IPSTACK_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const ips = await withTimeout(ipstackLookupIP(parsed.ipAddress!));
            if (ips) {
              data.ipstack = {
                countryName: ips.countryName,
                isProxy: ips.security?.isProxy || false,
                threatLevel: ips.security?.threatLevel,
                isTor: ips.security?.isTor || false,
              };

              const isHigh = ips.security?.threatLevel === "high" || ips.security?.threatLevel === "critical";
              const isTorOrProxy = Boolean(ips.security?.isTor || ips.security?.isProxy);
              const isThreat = isHigh || isTorOrProxy;
              const score = isHigh ? 65 : isTorOrProxy ? 35 : 0;

              providerResults["IPStack"] = {
                provider: "IPStack",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [
                      isHigh
                        ? `Flagged infrastructure with elevated threat level (${ips.security?.threatLevel})`
                        : `Host IP identified as active ${ips.security?.isTor ? "Tor node" : "Proxy/Anonymizer"}`,
                    ]
                  : ["Standard host infrastructure (No proxy or Tor flags detected)"],
                scoreContribution: score,
                relevance: "exact",
                details: {
                  countryName: ips.countryName,
                  threatLevel: ips.security?.threatLevel,
                  isProxy: ips.security?.isProxy,
                  isTor: ips.security?.isTor,
                },
              };

              if (isHigh) {
                data.suspiciousReports += 5;
              }
            } else {
              providerResults["IPStack"] = {
                provider: "IPStack",
                status: "clean",
                evidence: ["Clean infrastructure check"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("IPStack", err);
          }
        })()
      );
    }
  }

  // ============================================================
  // 15. Shodan
  // Relevance: IP
  // ============================================================
  if (targetType === "ip" && parsed.ipAddress) {
    if (!getShodanKey()) {
      markUnavailable("Shodan", "SHODAN_API_KEY is not configured");
    } else {
      queries.push(
        (async () => {
          try {
            const shodanData = await withTimeout(shodanLookupIP(parsed.ipAddress!));
            if (shodanData) {
              const vulns = (shodanData.vulns as string[]) || [];
              const ports = (shodanData.ports as number[]) || [];
              const isThreat = vulns.length > 0;

              providerResults["Shodan"] = {
                provider: "Shodan",
                status: isThreat ? "threat" : "clean",
                evidence: isThreat
                  ? [`Host server has ${vulns.length} known CVE vulnerability matches (${vulns.slice(0, 3).join(", ")})`]
                  : [`Exposed ports detected: ${ports.length > 0 ? ports.slice(0, 5).join(", ") : "None"}`],
                scoreContribution: isThreat ? Math.min(60, vulns.length * 20) : 0,
                relevance: "exact",
                details: {
                  ports,
                  vulnsCount: vulns.length,
                  isp: shodanData.isp,
                  org: shodanData.org,
                },
              };

              if (isThreat) {
                data.isKnownMalicious = true;
                data.suspiciousReports += vulns.length;
              }
            } else {
              providerResults["Shodan"] = {
                provider: "Shodan",
                status: "clean",
                evidence: ["No critical vulnerabilities detected on host"],
                scoreContribution: 0,
              };
            }
          } catch (err) {
            recordFailure("Shodan", err);
          }
        })()
      );
    }
  }

  // Domain Metadata Lookups (IP2WHOIS)
  if (!parsed.isIPBased && parsed.domain) {
    queries.push(
      (async () => {
        try {
          const whois = await withTimeout(ip2WhoisLookup(parsed.domain));
          if (whois) {
            data.ip2whois = {
              domainAge: typeof whois.domainAge === "number" ? whois.domainAge : null,
              registrar: (whois.registrar as Record<string, string>)?.name || "",
              createDate: (whois.createDate as string) || "",
            };
            if (typeof whois.domainAge === "number" && whois.domainAge < 30) {
              data.suspiciousReports += 5;
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] IP2WHOIS lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // Geolocation & Proxy (IP2Location)
  if (parsed.isIPBased && parsed.ipAddress) {
    queries.push(
      (async () => {
        try {
          const loc = await withTimeout(ip2LocationLookup(parsed.ipAddress!));
          if (loc) {
            data.ip2location = {
              countryName: loc.countryName,
              cityName: loc.cityName,
              isProxy: loc.isProxy,
            };
            if (loc.isProxy) {
              data.suspiciousReports += 4;
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] IP2Location lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // Wait for all queries to settle safely
  await Promise.allSettled(queries);

  return { threatIntelData: data, providerResults };
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
  lines.push(`🎯 Target Scope: ${analysis.targetType?.toUpperCase() || "URL"}`);
  lines.push("");

  const verdictEmoji = {
    SAFE: "✅",
    SUSPICIOUS: "⚠️",
    MALICIOUS: "🚨",
  }[analysis.verdict];

  lines.push(`${verdictEmoji} VERDICT: ${analysis.verdict}`);
  lines.push(`📊 Unified Risk Score: ${analysis.riskScore}/100 (${analysis.severity.toUpperCase()})`);
  lines.push(`🎯 Threat Level: ${analysis.threatLevel}`);
  if (analysis.coverage) {
    lines.push(
      `🛡️ Intelligence Coverage: ${analysis.coverage.responded} / ${analysis.coverage.totalRelevant} relevant engines responded (${analysis.coverage.percentage}%)`
    );
    lines.push(
      `   • Threats: ${analysis.coverage.threats} | Clean: ${analysis.coverage.clean} | Errors: ${analysis.coverage.errors} | Timeouts: ${analysis.coverage.timeouts} | Unavailable: ${analysis.coverage.unavailable}`
    );
  }
  lines.push("");

  // Risk Factors (excluding local heuristics & AlienVault OTX)
  const validRiskFactors = analysis.riskFactors.filter(
    (rf) => rf.source !== "Local URL Analysis" && rf.source !== "AlienVault OTX"
  );
  if (validRiskFactors.length > 0) {
    lines.push("⚠️ KEY RISK FACTORS IDENTIFIED:");
    validRiskFactors.forEach((rf, i) => {
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

  // "Why This Score?" Attribution
  lines.push("🔍 WHY THIS SCORE? (SCORE ATTRIBUTION):");
  if (analysis.providerResults) {
    Object.entries(analysis.providerResults).forEach(([pName, pRes]) => {
      if (pName === "AlienVault OTX" || pName === "Local URL Analysis") return;
      const statusTag = pRes.status.toUpperCase();
      const pts = pRes.status === "threat" ? `+${pRes.scoreContribution} pts` : `+0 pts (${statusTag})`;
      lines.push(`  • ${pName.padEnd(24)} ${pts}`);
    });
  }
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
