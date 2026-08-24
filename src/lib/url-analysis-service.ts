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
  otxLookupURL,
  otxLookupDomain,
  alphaMountainLookupURI,
  urlqueryLookup,
  yandexSafeBrowsingLookup,
  vxvaultLookupURL,
  ip2LocationLookup,
  ip2WhoisLookup,
  checkphishScanURL,
  urlscanLookup,
  phishstatsLookupURL,
  cloudmersiveScanURL,
  ipstackLookupIP,
} from "./threat-apis";

import {
  parseURL,
  performLocalURLAnalysis,
  calculateUnifiedRiskScore,
  CLOUDMERSIVE_ERROR_STATUSES,
  CLOUDMERSIVE_THREAT_STATUSES,
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
        otx: null,
        alphaMountain: null,
        urlquery: null,
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
  const pResults = scoring.providerResults;

  if (pResults["VirusTotal"]?.status === "threat") {
    const vt = threatIntelligence.virusTotal;
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
    const phishing = threatIntelligence.criminalIP?.phishingScore ?? 0;
    const malware = threatIntelligence.criminalIP?.malwareScore ?? 0;
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
      description: `Abusix: Domain/IP listed on threat intelligence blocklist (${threatIntelligence.abusix?.threatLevel}).`,
    });
  }

  if (pResults["AbuseIPDB"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: (threatIntelligence.abuseScore || 0) > 60 ? "HIGH" : "MEDIUM",
      description: `AbuseIPDB: Abuse confidence score ${threatIntelligence.abuseScore}%.`,
    });
  }

  if (pResults["AlienVault OTX"]?.status === "threat") {
    const otxResult = pResults["AlienVault OTX"];
    allFindings.push({
      category: "Threat Intelligence",
      severity: otxResult.scoreContribution >= 50 ? "CRITICAL" : "HIGH",
      description: `AlienVault OTX: Indicator flagged in ${threatIntelligence.otx?.pulseCount} threat pulse(s) (${otxResult.relevance} match).`,
    });
  }

  if (pResults["alphaMountain.ai"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: (threatIntelligence.alphaMountain?.riskScore || 0) >= 70 ? "CRITICAL" : "HIGH",
      description: `alphaMountain AI: Threat rating ${threatIntelligence.alphaMountain?.threatScore.toFixed(2)}/5.0 (${threatIntelligence.alphaMountain?.riskScore}% risk).`,
    });
  }

  if (threatIntelligence.ip2whois && typeof threatIntelligence.ip2whois.domainAge === "number") {
    if (threatIntelligence.ip2whois.domainAge < 30) {
      allFindings.push({
        category: "Domain Intelligence",
        severity: "HIGH",
        description: `IP2WHOIS: Newly registered domain created only ${threatIntelligence.ip2whois.domainAge} day(s) ago.`,
      });
    } else if (threatIntelligence.ip2whois.domainAge < 90) {
      allFindings.push({
        category: "Domain Intelligence",
        severity: "MEDIUM",
        description: `IP2WHOIS: Domain created recently (${threatIntelligence.ip2whois.domainAge} days ago).`,
      });
    }
  }

  if (threatIntelligence.ip2location?.isProxy) {
    allFindings.push({
      category: "Network Intelligence",
      severity: "MEDIUM",
      description: `IP2Location: Host IP is identified as an active Proxy / VPN / Anonymizer node.`,
    });
  }

  if (pResults["CheckPhish.ai"]?.status === "threat") {
    const cp = threatIntelligence.checkphish;
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
      description: `urlscan.io: Sandbox verdict classified page as malicious (Score: ${threatIntelligence.urlscan?.score}/100).`,
    });
  }

  if (pResults["PhishStats"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: (threatIntelligence.phishstats?.score || 0) >= 7 ? "CRITICAL" : "HIGH",
      description: `PhishStats: Real-time phishing index score ${threatIntelligence.phishstats?.score.toFixed(1)}/10.0${threatIntelligence.phishstats?.targetBrand ? ` targeting ${threatIntelligence.phishstats.targetBrand}` : ""}.`,
    });
  }

  if (pResults["Cloudmersive"]?.status === "threat") {
    allFindings.push({
      category: "Threat Intelligence",
      severity: "CRITICAL",
      description: `Cloudmersive: Anti-malware scanner detected threat (${threatIntelligence.cloudmersive?.websiteThreatType || "Malicious code detected"}).`,
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
  ipstack?: URLAnalysisResult["threatIntelligence"]["ipstack"];
  ip2whois?: { domainAge: number | null; registrar: string; createDate: string } | null;
  ip2location?: { countryName: string; cityName: string; isProxy: boolean } | null;
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
    otx: null,
    alphaMountain: null,
    urlquery: null,
    yandex: null,
    vxvault: null,
    checkphish: null,
    urlscan: null,
    phishstats: null,
    cloudmersive: null,
    ipstack: null,
    ip2whois: null,
    ip2location: null,
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

  // 6. AlienVault OTX Lookup (URL & Domain indicators)
  queries.push(
    (async () => {
      try {
        const otxData = await otxLookupURL(urlString);
        const otxDomain = (!otxData || (otxData.pulseCount as number) === 0) && parsed.domain ? await otxLookupDomain(parsed.domain) : null;
        const isUrlMatch = Boolean(otxData && (otxData.pulseCount as number) > 0);
        const finalOtx = isUrlMatch ? otxData : otxDomain;
        if (finalOtx && typeof finalOtx.pulseCount === "number") {
          result.otx = {
            pulseCount: finalOtx.pulseCount as number,
            sourceType: isUrlMatch ? "url" : "domain",
            pulses: ((finalOtx.pulses as Array<Record<string, unknown>>) || []).map((p) => ({
              id: (p.id as string) || "",
              name: (p.name as string) || "",
              author: (p.author as string) || "",
              tags: (p.tags as string[]) || [],
              created: (p.created as string) || "",
              modified: (p.modified as string) || "",
            })),
          };
          if ((finalOtx.pulseCount as number) > 0 && isUrlMatch) {
            result.isKnownMalicious = true;
            result.suspiciousReports += finalOtx.pulseCount as number;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] OTX lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 7. alphaMountain.ai Threat & Category Intelligence
  queries.push(
    (async () => {
      try {
        const target = parsed.domain || urlString;
        const alphaData = await alphaMountainLookupURI(target);
        if (alphaData) {
          result.alphaMountain = {
            threatScore: alphaData.threatScore as number,
            riskScore: alphaData.riskScore as number,
            categories: (alphaData.categories as number[]) || [],
            confidence: (alphaData.confidence as number) || 0,
            source: alphaData.source as string,
          };
          if ((alphaData.riskScore as number) >= 50) {
            result.isKnownMalicious = true;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] alphaMountain lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 8. URLQuery Search
  queries.push(
    (async () => {
      try {
        const target = parsed.domain || urlString;
        const uqData = await urlqueryLookup(target);
        if (uqData) {
          result.urlquery = {
            totalHits: (uqData.totalHits as number) || 0,
            reports: (uqData.reports as Array<{ id: string; url: string; status: string; date: string }>) || [],
          };
        }
      } catch (err) {
        console.error("[ThreatIntel] URLQuery lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 9. Yandex Safe Browsing Lookup
  queries.push(
    (async () => {
      try {
        const yandexData = await yandexSafeBrowsingLookup(urlString);
        if (yandexData) {
          result.yandex = yandexData;
          if (!yandexData.isSafe) {
            result.isKnownMalicious = true;
            result.suspiciousReports += 5;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] Yandex lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 10. VXVault Live Malware Feed Lookup
  queries.push(
    (async () => {
      try {
        const vxData = await vxvaultLookupURL(urlString);
        if (vxData) {
          result.vxvault = vxData;
          if (vxData.listed) {
            result.isKnownMalicious = true;
            result.suspiciousReports += 10;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] VXVault lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 11. CheckPhish.ai Deep Learning AI Scan
  queries.push(
    (async () => {
      try {
        const cpData = await checkphishScanURL(urlString);
        if (cpData) {
          result.checkphish = {
            disposition: cpData.disposition,
            brand: cpData.brand,
            insights: cpData.insights,
            screenshotUrl: cpData.screenshotUrl,
          };
          if (cpData.disposition === "phish") {
            result.isKnownMalicious = true;
            result.suspiciousReports += 8;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] CheckPhish scan error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 12. urlscan.io Automated Web Sandbox & Verdict Search
  queries.push(
    (async () => {
      try {
        const usData = await urlscanLookup(urlString);
        if (usData) {
          result.urlscan = {
            score: usData.score,
            malicious: usData.malicious,
            categories: usData.categories,
            technologies: usData.technologies,
            screenshotUrl: usData.screenshotUrl,
            reportUrl: usData.reportUrl,
          };
          if (usData.malicious || usData.score >= 50) {
            result.isKnownMalicious = true;
            result.suspiciousReports += 6;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] urlscan lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 13. PhishStats Threat Intelligence Index
  queries.push(
    (async () => {
      try {
        const psData = await phishstatsLookupURL(urlString);
        if (psData) {
          result.phishstats = {
            score: psData.score,
            tags: psData.tags,
            targetBrand: psData.targetBrand,
            threatType: psData.threatType,
          };
          if (psData.score >= 5) {
            result.isKnownMalicious = true;
            result.suspiciousReports += Math.round(psData.score);
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] PhishStats lookup error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 14. Cloudmersive Website / Anti-Malware Scan
  queries.push(
    (async () => {
      try {
        const cmData = await cloudmersiveScanURL(urlString);
        if (cmData) {
          result.cloudmersive = {
            cleanResult: cmData.cleanResult,
            websiteThreatType: cmData.websiteThreatType,
            foundViruses: cmData.foundViruses,
          };
          const rawType = (cmData.websiteThreatType || "").trim().toLowerCase();
          const isError = CLOUDMERSIVE_ERROR_STATUSES.has(rawType);
          const isPositiveThreat =
            !isError &&
            ((cmData.foundViruses && cmData.foundViruses.length > 0) ||
              CLOUDMERSIVE_THREAT_STATUSES.has(rawType));
          if (isPositiveThreat) {
            result.isKnownMalicious = true;
            result.suspiciousReports += 7;
          }
        }
      } catch (err) {
        console.error("[ThreatIntel] Cloudmersive scan error (non-fatal):", (err as Error).message);
      }
    })()
  );

  // 15. IPStack Security & Threat Intelligence (if IP-based)
  if (parsed.isIPBased && parsed.ipAddress) {
    queries.push(
      (async () => {
        try {
          const ips = await ipstackLookupIP(parsed.ipAddress!);
          if (ips) {
            result.ipstack = {
              countryName: ips.countryName,
              isProxy: ips.security?.isProxy || false,
              threatLevel: ips.security?.threatLevel,
              isTor: ips.security?.isTor || false,
            };
            if (ips.security?.threatLevel === "high" || ips.security?.threatLevel === "critical") {
              result.suspiciousReports += 5;
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] IPStack lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // 16. IP2WHOIS Domain Lookup
  if (!parsed.isIPBased && parsed.domain) {
    queries.push(
      (async () => {
        try {
          const whois = await ip2WhoisLookup(parsed.domain);
          if (whois) {
            result.ip2whois = {
              domainAge: typeof whois.domainAge === "number" ? whois.domainAge : null,
              registrar: (whois.registrar as Record<string, string>)?.name || "",
              createDate: (whois.createDate as string) || "",
            };
            if (typeof whois.domainAge === "number" && whois.domainAge < 30) {
              result.suspiciousReports += 5;
            }
          }
        } catch (err) {
          console.error("[ThreatIntel] IP2WHOIS lookup error (non-fatal):", (err as Error).message);
        }
      })()
    );
  }

  // 17. IP2Location Geolocation & Proxy Lookup (for IP-based hosts)
  if (parsed.isIPBased && parsed.ipAddress) {
    queries.push(
      (async () => {
        try {
          const loc = await ip2LocationLookup(parsed.ipAddress!);
          if (loc) {
            result.ip2location = {
              countryName: loc.countryName,
              cityName: loc.cityName,
              isProxy: loc.isProxy,
            };
            if (loc.isProxy) {
              result.suspiciousReports += 4;
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
