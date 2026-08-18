// ============================================
// XEROVA — URL Analysis Service
// ============================================
// Integrated URL analysis with threat intelligence

import { vtLookupURL, vtLookupDomain, abuseIPDBLookup } from "./threat-apis";
import {
  parseURL,
  analyzeURLCharacteristics,
  analyzeDomainCharacteristics,
  calculateRiskScore,
  scoreToVerdict,
  URLAnalysisResult,
  URLParseResult,
} from "./url-analyzer";

export async function analyzeURL(urlString: string): Promise<URLAnalysisResult> {
  // ---- Step 1: Parse URL ----
  const parsed = parseURL(urlString);
  
  if (parsed.error) {
    return {
      url: urlString,
      verdict: "SUSPICIOUS",
      riskScore: 60,
      threatLevel: "HIGH",
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
        redirectionChain: [],
        issues: [parsed.error],
      },
      domainCharacteristics: {
        hasPunycode: false,
        hasSuspiciousTLD: false,
        hasExcessiveHyphens: false,
        lookalikeDomains: [],
        brandImpersonationDetected: false,
        suspiciousKeywords: [],
        domainAge: null,
        issues: [],
      },
      threatIntelligence: {
        virusTotal: null,
        abuseScore: null,
        isKnownMalicious: false,
        suspiciousReports: 0,
      },
      riskBreakdown: {
        urlStructuralRisk: 0,
        domainCharacteristicRisk: 0,
        threatIntelligenceRisk: 60,
        totalRisk: 60,
      },
      findings: [
        {
          category: "URL Parsing",
          severity: "HIGH",
          description: `Failed to parse URL: ${parsed.error}`,
        },
      ],
    };
  }
  
  // ---- Step 2: Structural Analysis ----
  const {
    characteristics: urlCharacteristics,
    findings: urlFindings,
  } = analyzeURLCharacteristics(parsed);
  
  // ---- Step 3: Domain Analysis ----
  const {
    characteristics: domainCharacteristics,
    findings: domainFindings,
  } = analyzeDomainCharacteristics(parsed);
  
  // ---- Step 4: Threat Intelligence Lookup ----
  const threatIntelligence = await fetchThreatIntelligence(parsed, urlString);
  
  // ---- Step 5: Risk Calculation ----
  const { totalScore, breakdown } = calculateRiskScore(
    urlCharacteristics,
    domainCharacteristics,
    threatIntelligence
  );
  
  const { verdict, threatLevel } = scoreToVerdict(totalScore);
  
  // ---- Step 6: Compile findings ----
  const allFindings = [...urlFindings, ...domainFindings];
  
  // Add threat intelligence findings
  if (threatIntelligence.virusTotal) {
    const { maliciousEngines, suspiciousEngines } = threatIntelligence.virusTotal;
    if (maliciousEngines > 0) {
      allFindings.push({
        category: "Threat Intelligence",
        severity: "CRITICAL",
        description: `VirusTotal flagged by ${maliciousEngines} security engines as malicious.`,
      });
    }
    if (suspiciousEngines > 0) {
      allFindings.push({
        category: "Threat Intelligence",
        severity: "HIGH",
        description: `VirusTotal flagged by ${suspiciousEngines} security engines as suspicious.`,
      });
    }
  }
  
  if (threatIntelligence.abuseScore && threatIntelligence.abuseScore > 50) {
    allFindings.push({
      category: "Threat Intelligence",
      severity: "HIGH",
      description: `AbuseIPDB abuse confidence score: ${threatIntelligence.abuseScore}%.`,
    });
  }
  
  // ---- Compile Final Result ----
  return {
    url: urlString,
    verdict,
    riskScore: totalScore,
    threatLevel,
    structural: {
      protocol: parsed.protocol,
      domain: parsed.domain,
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      query: parsed.query,
      urlLength: parsed.urlLength,
      subdominCount: parsed.subdomain?.split(".").length ?? 0,
      isIPBased: parsed.isIPBased,
      ipAddress: parsed.ipAddress,
    },
    urlCharacteristics,
    domainCharacteristics,
    threatIntelligence,
    riskBreakdown: breakdown,
    findings: allFindings.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    }),
  };
}

interface ThreatIntelData {
  virusTotal: URLAnalysisResult["threatIntelligence"]["virusTotal"];
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
    abuseScore: null,
    isKnownMalicious: false,
    suspiciousReports: 0,
  };
  
  // Fetch VirusTotal data for URL
  const vtData = await vtLookupURL(urlString);
  if (vtData && typeof vtData === "object" && "url" in vtData) {
    const stats = (vtData as Record<string, unknown>).last_analysis_stats as Record<string, number> || {};
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const harmless = stats.harmless || 0;
    const undetected = stats.undetected || 0;
    
    result.virusTotal = {
      reputation: (vtData as Record<string, unknown>).reputation as number || 0,
      maliciousEngines: malicious,
      suspiciousEngines: suspicious,
      harmlessEngines: harmless,
      undetectedEngines: undetected,
      lastAnalysisDate: (vtData as Record<string, unknown>).lastAnalysisDate as string || null,
      categories: (vtData as Record<string, unknown>).categories as Record<string, string> || {},
    };
    
    if (malicious > 0) {
      result.isKnownMalicious = true;
      result.suspiciousReports = malicious;
    }
  }
  
  // Fetch VirusTotal data for domain
  const vtDomainData = await vtLookupDomain(parsed.domain);
  if (vtDomainData && typeof vtDomainData === "object" && "reputation" in vtDomainData) {
    const reputation = (vtDomainData as Record<string, unknown>).reputation as number || 0;
    const categories = (vtDomainData as Record<string, unknown>).categories as Record<string, string> || {};
    
    // Check for suspicious categories
    const categoryValues = Object.values(categories) as string[];
    if (categoryValues.some(cat => 
      cat.toLowerCase().includes("malware") || 
      cat.toLowerCase().includes("phishing") ||
      cat.toLowerCase().includes("trojan") ||
      cat.toLowerCase().includes("suspicious")
    )) {
      result.isKnownMalicious = true;
    }
    
    if (reputation < -50) {
      result.isKnownMalicious = true;
      result.suspiciousReports += Math.abs(reputation);
    }
  }
  
  // Fetch AbuseIPDB data if URL contains IP
  if (parsed.ipAddress) {
    const abuseData = await abuseIPDBLookup(parsed.ipAddress);
    if (abuseData && typeof abuseData === "object" && "abuseConfidenceScore" in abuseData) {
      const score = (abuseData as Record<string, unknown>).abuseConfidenceScore as number || 0;
      result.abuseScore = score;
      
      if (score > 50) {
        result.isKnownMalicious = true;
        result.suspiciousReports += Math.round(score / 20);
      }
    }
  }
  
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
  
  // URL Analyzed
  lines.push(`🔗 URL Analyzed: ${analysis.url}`);
  lines.push("");
  
  // Verdict
  const verdictEmoji = {
    SAFE: "✅",
    SUSPICIOUS: "⚠️",
    MALICIOUS: "🚨",
  }[analysis.verdict];
  
  lines.push(`${verdictEmoji} VERDICT: ${analysis.verdict}`);
  lines.push(`📊 Risk Score: ${analysis.riskScore}/100`);
  lines.push(`🎯 Threat Level: ${analysis.threatLevel}`);
  lines.push("");
  
  // Risk Breakdown
  lines.push("📈 RISK SCORE BREAKDOWN:");
  lines.push(`  • URL Structural Risk: ${analysis.riskBreakdown.urlStructuralRisk}/25`);
  lines.push(`  • Domain Characteristic Risk: ${analysis.riskBreakdown.domainCharacteristicRisk}/35`);
  lines.push(`  • Threat Intelligence Risk: ${analysis.riskBreakdown.threatIntelligenceRisk}/40`);
  lines.push("");
  
  // Structural Analysis
  lines.push("🔍 STRUCTURAL ANALYSIS:");
  lines.push(`  • Protocol: ${analysis.structural.protocol.toUpperCase()}`);
  lines.push(`  • Domain: ${analysis.structural.domain}`);
  lines.push(`  • Hostname: ${analysis.structural.hostname}`);
  lines.push(`  • Port: ${analysis.structural.port || "default"}`);
  lines.push(`  • URL Length: ${analysis.structural.urlLength} characters`);
  lines.push(`  • Subdomains: ${analysis.structural.subdominCount}`);
  if (analysis.structural.isIPBased) {
    lines.push(`  • ⚠️ IP-Based URL: ${analysis.structural.ipAddress}`);
  }
  lines.push("");
  
  // URL Characteristics Issues
  if (analysis.urlCharacteristics.issues.length > 0) {
    lines.push("⚠️  URL CHARACTERISTICS ISSUES:");
    analysis.urlCharacteristics.issues.forEach(issue => {
      lines.push(`  • ${issue}`);
    });
    lines.push("");
  }
  
  // Domain Characteristics Issues
  if (analysis.domainCharacteristics.issues.length > 0) {
    lines.push("🌐 DOMAIN CHARACTERISTICS ISSUES:");
    analysis.domainCharacteristics.issues.forEach(issue => {
      lines.push(`  • ${issue}`);
    });
    lines.push("");
  }
  
  // Threat Intelligence
  if (analysis.threatIntelligence.virusTotal) {
    const vt = analysis.threatIntelligence.virusTotal;
    lines.push("🛡️  VIRUSTOTAL ANALYSIS:");
    lines.push(`  • Malicious Engines: ${vt.maliciousEngines}`);
    lines.push(`  • Suspicious Engines: ${vt.suspiciousEngines}`);
    lines.push(`  • Harmless Engines: ${vt.harmlessEngines}`);
    lines.push(`  • Undetected Engines: ${vt.undetectedEngines}`);
    lines.push(`  • Reputation Score: ${vt.reputation}`);
    if (vt.lastAnalysisDate) {
      lines.push(`  • Last Analysis: ${vt.lastAnalysisDate}`);
    }
    lines.push("");
  }
  
  if (analysis.threatIntelligence.abuseScore !== null) {
    lines.push("⚠️  ABUSE CONFIDENCE SCORE: " + analysis.threatIntelligence.abuseScore + "%");
    lines.push("");
  }
  
  // Detailed Findings
  if (analysis.findings.length > 0) {
    lines.push("📋 DETAILED FINDINGS:");
    analysis.findings.forEach((finding, i) => {
      const severityEmoji = {
        LOW: "ℹ️",
        MEDIUM: "⚠️",
        HIGH: "🔴",
        CRITICAL: "🚨",
      }[finding.severity];
      
      lines.push(`  ${i + 1}. ${severityEmoji} [${finding.severity}] ${finding.category}`);
      lines.push(`     ${finding.description}`);
    });
    lines.push("");
  }
  
  // Recommendation
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("📌 RECOMMENDATION:");
  const recommendations = {
    SAFE: "This URL appears to be safe. Proceed with normal caution.",
    SUSPICIOUS: "⚠️  Use caution when visiting this URL. Verify the domain before entering credentials.",
    MALICIOUS: "🚨 DO NOT visit this URL. It is flagged as potentially malicious.",
  };
  lines.push(`   ${recommendations[analysis.verdict]}`);
  lines.push("═══════════════════════════════════════════════════════════");
  
  return lines.join("\n");
}
