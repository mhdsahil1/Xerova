// ============================================
// XEROVA — Malicious URL & Website Analyzer
// ============================================
// Advanced Two-Layer URL analysis engine:
// Layer 1: Local Heuristic Analysis (independent of external services)
// Layer 2: External Threat Intelligence Aggregation (VirusTotal, Criminal IP, AbuseIPDB, Abusix, Shodan)
// → Evidence Aggregation → Unified Risk Score → Severity + Risk Factors

import type {
  NormalizedProviderResult,
  ProviderStatus,
  TargetClassification,
  AnalysisCoverage,
} from "@/types";

export interface RiskFactor {
  source:
    | "Local URL Analysis"
    | "VirusTotal"
    | "Criminal IP"
    | "Abusix"
    | "AbuseIPDB"
    | "Shodan"
    | "AlienVault OTX"
    | "alphaMountain.ai"
    | "URLQuery"
    | "Yandex Safe Browsing"
    | "Google Safe Browsing"
    | "VXVault Threat Feed"
    | "PhishStats"
    | "urlscan.io"
    | "CheckPhish.ai"
    | "Cloudmersive"
    | "IPStack";
  category: string;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  scoreContribution?: number;
}

export interface URLAnalysisResult {
  url: string;
  verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  riskScore: number; // 0-100
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severity: "info" | "low" | "medium" | "high" | "critical";
  sources: string[];
  riskFactors: RiskFactor[];
  targetType?: TargetClassification;
  coverage?: AnalysisCoverage;

  // Structural Analysis
  structural: {
    protocol: "http" | "https" | "unknown";
    domain: string;
    hostname: string;
    port: number | null;
    path: string;
    query: string;
    urlLength: number;
    subdominCount: number;
    isIPBased: boolean;
    ipAddress: string | null;
    entropy: number;
  };

  // URL Characteristics
  urlCharacteristics: {
    usesHTTPS: boolean;
    hasExcessiveLength: boolean;
    hasMultipleSubdomains: boolean;
    hasIPAddress: boolean;
    hasSuspiciousPort: boolean;
    hasURLEncoding: boolean;
    hasObfuscatedCharacters: boolean;
    hasExcessiveRedirects: boolean;
    hasHighEntropy: boolean;
    hasSuspiciousQuery: boolean;
    redirectionChain: string[];
    issues: string[];
  };

  // Domain Characteristics
  domainCharacteristics: {
    hasPunycode: boolean;
    hasSuspiciousTLD: boolean;
    hasExcessiveHyphens: boolean;
    lookalikeDomains: string[];
    brandImpersonationDetected: boolean;
    impersonatedBrand: string | null;
    suspiciousKeywords: string[];
    domainAge: number | null;
    issues: string[];
  };

  // Threat Intelligence
  threatIntelligence: {
    virusTotal: {
      reputation: number;
      maliciousEngines: number;
      suspiciousEngines: number;
      harmlessEngines: number;
      undetectedEngines: number;
      lastAnalysisDate: string | null;
      categories: Record<string, string>;
    } | null;
    criminalIP?: {
      riskScore: number | null;
      phishingScore: number | null;
      malwareScore: number | null;
      technologies?: string[];
    } | null;
    abusix?: {
      listed: boolean;
      threatLevel: string;
      categories: string[];
    } | null;
    otx?: {
      pulseCount: number;
      sourceType?: "url" | "domain";
      pulses: Array<{ id: string; name: string; author: string; tags: string[]; created?: string; modified?: string }>;
    } | null;
    alphaMountain?: {
      threatScore: number;
      riskScore: number;
      categories: number[];
      confidence: number;
      source?: string;
    } | null;
    urlquery?: {
      totalHits: number;
      reports: Array<{ id: string; url: string; status: string; date: string }>;
    } | null;
    yandex?: {
      isSafe: boolean;
      matches: Array<{ threatType: string; platformType: string; threatEntryType: string }>;
    } | null;
    vxvault?: {
      listed: boolean;
      matchUrl?: string;
    } | null;
    phishstats?: {
      score: number;
      tags: string[];
      targetBrand?: string;
      threatType?: string;
    } | null;
    urlscan?: {
      score: number;
      malicious: boolean;
      categories: string[];
      technologies?: string[];
      screenshotUrl?: string;
      reportUrl?: string;
    } | null;
    checkphish?: {
      disposition: "phish" | "clean" | "suspicious" | "unknown";
      brand?: string;
      insights?: string;
      screenshotUrl?: string;
    } | null;
    cloudmersive?: {
      cleanResult: boolean;
      websiteThreatType?: string;
      foundViruses: Array<{ fileName: string; virusName: string }>;
    } | null;
    googleSafeBrowsing?: {
      isThreat: boolean;
      threatTypes: string[];
      platformTypes: string[];
    } | null;
    ipstack?: {
      countryName: string;
      isProxy: boolean;
      threatLevel?: string;
      isTor?: boolean;
    } | null;
    abuseScore: number | null;
    isKnownMalicious: boolean;
    suspiciousReports: number;
  };

  // Risk Scoring Breakdown
  riskBreakdown: {
    localHeuristicRisk: number;
    urlStructuralRisk: number;
    domainCharacteristicRisk: number;
    pathQueryRisk: number;
    threatIntelligenceRisk: number;
    totalRisk: number;
  };

  // Detailed Findings
  findings: Array<{
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
  }>;

  // Analysis Metadata
  timestamp?: string;
  providerResults?: Record<string, NormalizedProviderResult>;
}

export interface URLParseResult {
  url: string;
  protocol: "http" | "https" | "unknown";
  hostname: string;
  domain: string;
  port: number | null;
  path: string;
  query: string;
  queryParams: Record<string, string>;
  subdomain: string | null;
  isIPBased: boolean;
  ipAddress: string | null;
  urlLength: number;
  entropy: number;
  error?: string;
}

// ---- Shannon Entropy Calculation ----
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(frequencies)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

// ---- URL Parsing ----
export function parseURL(urlString: string): URLParseResult {
  try {
    let normalized = urlString.trim();
    if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      normalized = "https://" + normalized;
    }

    const parsed = new URL(normalized);

    const protocol =
      parsed.protocol === "https:"
        ? "https"
        : parsed.protocol === "http:"
          ? "http"
          : "unknown";

    const hostname = (parsed.hostname || "").toLowerCase();
    const port = parsed.port ? parseInt(parsed.port, 10) : null;
    const path = parsed.pathname || "/";
    const query = parsed.search || "";

    // Parse query params into key-value pairs
    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((val, key) => {
      queryParams[key.toLowerCase()] = val.toLowerCase();
    });

    // Detect IP address (IPv4 / IPv6)
    const isIPBased =
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
      /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(hostname);

    // Extract domain and subdomain
    let domain = hostname;
    let subdomain: string | null = null;

    if (!isIPBased && hostname.includes(".")) {
      const parts = hostname.split(".");
      const twoPartTLDs = ["co.uk", "org.uk", "gov.uk", "com.au", "net.au", "co.nz", "co.jp", "com.br"];
      const lastTwo = parts.slice(-2).join(".");
      if (twoPartTLDs.includes(lastTwo) && parts.length > 2) {
        domain = parts.slice(-3).join(".");
        subdomain = parts.length > 3 ? parts.slice(0, -3).join(".") : null;
      } else {
        domain = parts.slice(-2).join(".");
        subdomain = parts.length > 2 ? parts.slice(0, -2).join(".") : null;
      }
    }

    // Calculate entropy on domain core (subdomain + sld)
    const sldAndSub = subdomain ? `${subdomain}.${domain.split(".")[0]}` : domain.split(".")[0];
    const entropy = calculateShannonEntropy(sldAndSub);

    return {
      url: urlString,
      protocol,
      hostname,
      domain,
      port,
      path,
      query,
      queryParams,
      subdomain,
      isIPBased,
      ipAddress: isIPBased ? hostname : null,
      urlLength: urlString.length,
      entropy,
    };
  } catch (e) {
    return {
      url: urlString,
      protocol: "unknown",
      hostname: "",
      domain: "",
      port: null,
      path: "",
      query: "",
      queryParams: {},
      subdomain: null,
      isIPBased: false,
      ipAddress: null,
      urlLength: urlString.length,
      entropy: 0,
      error: `Failed to parse URL: ${(e as Error).message}`,
    };
  }
}

// ---- Known Brand Impersonation Database ----
export interface BrandTarget {
  name: string;
  aliases: string[];
  legitimateDomains: string[];
}

export const TARGET_BRANDS: BrandTarget[] = [
  { name: "paypal", aliases: ["paypal", "paypa1", "paypall", "p4ypal"], legitimateDomains: ["paypal.com", "paypal.me", "paypal-community.com"] },
  { name: "microsoft", aliases: ["microsoft", "microsft", "m1crosoft", "office365", "outlook", "onedrive", "azure"], legitimateDomains: ["microsoft.com", "live.com", "office.com", "office365.com", "microsoftonline.com", "azure.com", "windows.com", "xbox.com", "msn.com", "sharepoint.com", "onedrive.com", "outlook.com", "hotmail.com"] },
  { name: "apple", aliases: ["apple", "aple", "appl3", "icloud"], legitimateDomains: ["apple.com", "icloud.com"] },
  { name: "google", aliases: ["google", "googe", "goog1e", "g00gle", "gmail", "youtube"], legitimateDomains: ["google.com", "gmail.com", "youtube.com", "google.co.uk", "google.ca", "google.de"] },
  { name: "amazon", aliases: ["amazon", "amaz0n", "amazom", "primevideo"], legitimateDomains: ["amazon.com", "amazon.co.uk", "amazon.de", "amazon.co.jp", "aws.amazon.com", "primevideo.com"] },
  { name: "netflix", aliases: ["netflix", "netflx", "netf1ix"], legitimateDomains: ["netflix.com"] },
  { name: "facebook", aliases: ["facebook", "faceb00k", "instagram", "whatsapp"], legitimateDomains: ["facebook.com", "fb.com", "meta.com", "instagram.com", "whatsapp.com"] },
  { name: "chase", aliases: ["chase", "jpmorgan"], legitimateDomains: ["chase.com", "jpmorganchase.com", "jpmorgan.com"] },
  { name: "wellsfargo", aliases: ["wellsfargo", "wells-fargo"], legitimateDomains: ["wellsfargo.com"] },
  { name: "bankofamerica", aliases: ["bankofamerica", "bofa"], legitimateDomains: ["bankofamerica.com", "bofa.com"] },
  { name: "citibank", aliases: ["citibank"], legitimateDomains: ["citi.com", "citibank.com"] },
  { name: "binance", aliases: ["binance", "binanace"], legitimateDomains: ["binance.com", "binance.us"] },
  { name: "coinbase", aliases: ["coinbase", "c0inbase"], legitimateDomains: ["coinbase.com"] },
  { name: "dhl", aliases: ["dhl", "dhl-express"], legitimateDomains: ["dhl.com", "dhl-express.com"] },
  { name: "fedex", aliases: ["fedex", "fed-ex"], legitimateDomains: ["fedex.com"] },
  { name: "usps", aliases: ["usps", "postalservice"], legitimateDomains: ["usps.com"] },
  { name: "steam", aliases: ["steam", "steampowered", "steamcommunity"], legitimateDomains: ["steampowered.com", "steamcommunity.com"] },
  { name: "roblox", aliases: ["roblox", "r0blox"], legitimateDomains: ["roblox.com"] },
  { name: "telegram", aliases: ["telegram"], legitimateDomains: ["telegram.org", "t.me"] },
  { name: "linkedin", aliases: ["linkedin", "linkedln"], legitimateDomains: ["linkedin.com"] },
  { name: "twitter", aliases: ["twitter"], legitimateDomains: ["twitter.com", "x.com"] },
  { name: "americanexpress", aliases: ["americanexpress", "american-express", "amex"], legitimateDomains: ["americanexpress.com", "amex.com", "americanexpress.co.uk"] },
  { name: "itau", aliases: ["itau", "bancoitau", "itaucard"], legitimateDomains: ["itau.com.br", "itau.com", "bancoitau.com.br"] },
];

export const SUSPICIOUS_TLDS = [
  "top", "tk", "ml", "ga", "cf", "gq", "xyz", "work", "download",
  "stream", "click", "science", "date", "trade", "webcam", "online",
  "website", "bid", "racing", "review", "faith", "accountant", "men",
  "zip", "mov", "buzz", "cam", "fit", "rest", "icu", "sbs", "country",
  "kim", "surf", "gdn", "mom", "link",
];

export const SYNTHETIC_TEST_TLDS = ["test", "invalid", "example", "localhost"];

export const AUTH_CREDENTIAL_KEYWORDS = [
  "login", "signin", "sign-in", "log-in", "logon", "password", "passwd",
  "pwd", "credential", "auth", "authenticate", "authentication", "sso",
  "oauth", "2fa", "mfa", "otp", "passcode",
];

export const VERIFICATION_SECURITY_KEYWORDS = [
  "verify", "verification", "verify-account", "account", "security", "secure",
  "confirm", "confirmation", "identity", "validate", "validation", "recovery",
  "unlock", "activate", "reactivate", "suspension", "suspended", "restrict",
  "restricted", "protect", "unauthorized",
];

export const BILLING_PAYMENT_KEYWORDS = [
  "payment", "billing", "invoice", "wallet", "banking", "bank", "refund",
  "transfer", "checkout", "creditcard", "debitcard", "crypto", "pay",
];

export const URGENCY_ACTION_KEYWORDS = [
  "urgent", "alert", "action-required", "session-expired", "expired",
  "warning", "immediate", "notice", "alert-action", "locked",
];

// ---- Local URL Heuristic Analysis ----
export function performLocalURLAnalysis(parsed: URLParseResult): {
  urlCharacteristics: URLAnalysisResult["urlCharacteristics"];
  domainCharacteristics: URLAnalysisResult["domainCharacteristics"];
  pathQueryCharacteristics: {
    suspiciousPathKeywords: string[];
    suspiciousQueryParams: string[];
    hasOpenRedirect: boolean;
  };
  riskFactors: RiskFactor[];
  findings: Array<{ category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; description: string }>;
  localScore: number;
  breakdown: {
    urlStructuralRisk: number;
    domainCharacteristicRisk: number;
    pathQueryRisk: number;
  };
} {
  const riskFactors: RiskFactor[] = [];
  const findings: Array<{ category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; description: string }> = [];

  let urlStructuralRisk = 0;
  let domainCharacteristicRisk = 0;
  let pathQueryRisk = 0;

  // 1. Structural Checks
  const hasMultipleSubdomains = (parsed.subdomain?.split(".").length ?? 0) >= 2;
  const hasExcessiveLength = parsed.urlLength > 75;
  const isSuspiciousPort = hasSuspiciousPort(parsed.port);
  const hasURLEncoding = /%[0-9A-Fa-f]{2}/.test(parsed.url);
  const hasObfuscatedChars = hasObfuscatedCharacters(parsed.url);

  // High entropy applies to long randomized subdomains/SLDs (>= 14 chars with entropy > 3.8)
  const sldAndSub = parsed.subdomain
    ? `${parsed.subdomain}.${parsed.domain.split(".")[0]}`
    : parsed.domain.split(".")[0];
  const hasHighEntropy = sldAndSub.length >= 14 && parsed.entropy > 3.8;

  const urlIssues: string[] = [];

  if (parsed.protocol === "http") {
    urlStructuralRisk += 5;
    urlIssues.push("Unencrypted HTTP protocol");
    findings.push({
      category: "Protocol",
      severity: "LOW",
      description: "URL uses unencrypted HTTP protocol instead of HTTPS.",
    });
  }

  if (parsed.isIPBased) {
    urlStructuralRisk += 15;
    urlIssues.push(`Direct IP hostname: ${parsed.ipAddress}`);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Hostname",
      reason: `Direct IP address used as hostname (${parsed.ipAddress}) instead of standard domain`,
      severity: "HIGH",
      scoreContribution: 15,
    });
    findings.push({
      category: "URL Structure",
      severity: "HIGH",
      description: `URL uses direct IP address (${parsed.ipAddress}) instead of domain name. Common in unverified infrastructure.`,
    });
  }

  if (hasMultipleSubdomains) {
    urlStructuralRisk += 8;
    urlIssues.push(`Multiple subdomains (${parsed.subdomain})`);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Domain Structure",
      reason: `Excessive subdomain nesting (${parsed.subdomain}) commonly used in phishing campaigns`,
      severity: "MEDIUM",
      scoreContribution: 8,
    });
    findings.push({
      category: "URL Structure",
      severity: "MEDIUM",
      description: `Excessive subdomain nesting detected (${parsed.subdomain}).`,
    });
  }

  if (hasExcessiveLength) {
    urlStructuralRisk += 4;
    urlIssues.push(`Excessive URL length (${parsed.urlLength} characters)`);
    findings.push({
      category: "URL Structure",
      severity: "LOW",
      description: `URL is unusually long (${parsed.urlLength} chars).`,
    });
  }

  if (isSuspiciousPort) {
    urlStructuralRisk += 10;
    urlIssues.push(`Non-standard port: ${parsed.port}`);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Port",
      reason: `URL specifies non-standard service port: ${parsed.port}`,
      severity: "HIGH",
      scoreContribution: 10,
    });
  }

  if (hasURLEncoding || hasObfuscatedChars) {
    urlStructuralRisk += 8;
    urlIssues.push("Obfuscated or encoded characters detected");
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Obfuscation",
      reason: "URL contains encoded or obfuscated character sequences to evade pattern filters",
      severity: "MEDIUM",
      scoreContribution: 8,
    });
  }

  if (hasHighEntropy) {
    urlStructuralRisk += 8;
    urlIssues.push(`High Shannon entropy (${parsed.entropy}) in domain string`);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Entropy",
      reason: `High entropy score (${parsed.entropy}) suggests randomized or algorithmically generated hostname`,
      severity: "MEDIUM",
      scoreContribution: 8,
    });
  }

  urlStructuralRisk = Math.min(25, urlStructuralRisk);

  // 2. Domain & Brand Impersonation Checks
  const domainIssues: string[] = [];
  const hasPunycode = parsed.hostname.startsWith("xn--");
  const tld = parsed.domain.split(".").pop()?.toLowerCase() || "";
  const isSuspiciousTLD = SUSPICIOUS_TLDS.includes(tld);
  const isTestTLD = SYNTHETIC_TEST_TLDS.includes(tld);
  const hasExcessiveHyphens = (parsed.hostname.match(/-/g) || []).length >= 2;

  if (hasPunycode) {
    domainCharacteristicRisk += 15;
    domainIssues.push("Punycode (xn--) homograph domain detected");
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Homograph",
      reason: "Punycode (xn--) internationalized domain detected (potential IDN homograph spoofing)",
      severity: "HIGH",
      scoreContribution: 15,
    });
  }

  if (isSuspiciousTLD) {
    domainCharacteristicRisk += 10;
    domainIssues.push(`High-abuse TLD: .${tld}`);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Domain Reputation",
      reason: `Domain uses top-level domain (.${tld}) with high abuse and phishing prevalence`,
      severity: "MEDIUM",
      scoreContribution: 10,
    });
  }

  if (isTestTLD && !["example.com", "example.org", "example.net"].includes(parsed.domain)) {
    domainCharacteristicRisk += 6;
    domainIssues.push(`Synthetic / non-delegated test TLD: .${tld}`);
  }

  if (hasExcessiveHyphens) {
    domainCharacteristicRisk += 8;
    domainIssues.push("Excessive hyphen separators in hostname");
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Domain Structure",
      reason: "Excessive hyphen separators in hostname (characteristic of multi-keyword phishing domains)",
      severity: "MEDIUM",
      scoreContribution: 8,
    });
  }

  // Brand Impersonation Engine
  const { impersonatedBrand, isImpersonating, lookalikes } = checkBrandImpersonation(parsed);

  if (isImpersonating && impersonatedBrand) {
    domainCharacteristicRisk += 32;
    domainIssues.push(`Brand impersonation detected: ${impersonatedBrand.toUpperCase()}`);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Brand Impersonation",
      reason: `Suspicious brand impersonation pattern: brand '${impersonatedBrand}' used on unrelated domain '${parsed.domain}'`,
      severity: "CRITICAL",
      scoreContribution: 32,
    });
    findings.push({
      category: "Brand Impersonation",
      severity: "CRITICAL",
      description: `Domain appears to impersonate '${impersonatedBrand.toUpperCase()}' on non-official domain '${parsed.domain}'. Likely phishing attempt.`,
    });
  }

  if (lookalikes.length > 0) {
    domainCharacteristicRisk += 20;
    domainIssues.push(`Typosquatting/lookalike target: ${lookalikes.join(", ")}`);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Typosquatting",
      reason: `Domain name resembles legitimate brand domain (lookalike target: ${lookalikes.join(", ")})`,
      severity: "HIGH",
      scoreContribution: 20,
    });
  }

  // Suspicious Domain Keywords (excluding genuine domain name)
  const domainKeywords = extractKeywords(parsed.subdomain ? `${parsed.subdomain}.${parsed.domain.split(".")[0]}` : "");
  if (domainKeywords.length > 0) {
    domainCharacteristicRisk += Math.min(domainKeywords.length * 4, 12);
    domainIssues.push(`Suspicious domain keywords: ${domainKeywords.join(", ")}`);
  }

  domainCharacteristicRisk = Math.min(40, domainCharacteristicRisk);

  // 3. Path & Query Analysis
  const pathKeywords = extractKeywords(parsed.path);
  const suspiciousQueryParams: string[] = [];
  let hasOpenRedirect = false;

  // Check query parameter keys & values
  for (const [key, value] of Object.entries(parsed.queryParams)) {
    const isSuspiciousKey =
      AUTH_CREDENTIAL_KEYWORDS.includes(key) ||
      VERIFICATION_SECURITY_KEYWORDS.includes(key) ||
      URGENCY_ACTION_KEYWORDS.includes(key) ||
      ["session", "expired", "verify", "token", "redirect", "url", "return", "dest", "continue"].includes(key);

    const isSuspiciousValue =
      URGENCY_ACTION_KEYWORDS.includes(value) ||
      VERIFICATION_SECURITY_KEYWORDS.includes(value) ||
      AUTH_CREDENTIAL_KEYWORDS.includes(value) ||
      ["expired", "true", "verify", "1", "yes"].includes(value);

    if (isSuspiciousKey || isSuspiciousValue) {
      suspiciousQueryParams.push(`${key}=${value}`);
    }

    if (["redirect", "url", "return", "goto", "dest", "next", "target"].includes(key)) {
      if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("//")) {
        hasOpenRedirect = true;
      }
    }
  }

  if (pathKeywords.length > 0) {
    pathQueryRisk += Math.min(pathKeywords.length * 7, 18);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Path Analysis",
      reason: `Authentication and verification keywords identified in URL path: ${pathKeywords.join(", ")}`,
      severity: "HIGH",
      scoreContribution: Math.min(pathKeywords.length * 7, 18),
    });
    findings.push({
      category: "Path Analysis",
      severity: "HIGH",
      description: `URL path contains credential/verification endpoints (${pathKeywords.join(", ")}).`,
    });
  }

  if (suspiciousQueryParams.length > 0) {
    pathQueryRisk += Math.min(suspiciousQueryParams.length * 6, 16);
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Query Parameters",
      reason: `Suspicious session/credential query parameters: ${suspiciousQueryParams.join(", ")}`,
      severity: "MEDIUM",
      scoreContribution: Math.min(suspiciousQueryParams.length * 6, 16),
    });
    findings.push({
      category: "Query Parameters",
      severity: "MEDIUM",
      description: `Suspicious query parameters detected (${suspiciousQueryParams.join(", ")}).`,
    });
  }

  if (hasOpenRedirect) {
    pathQueryRisk += 12;
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Open Redirect",
      reason: "Potential open redirect pattern detected in query parameter forwarding to another URL",
      severity: "HIGH",
      scoreContribution: 12,
    });
  }

  // Check for brand impersonation or embedded host structures in path
  const lowerPath = parsed.path.toLowerCase();
  for (const target of TARGET_BRANDS) {
    const isLegitimate = target.legitimateDomains.some(
      (legit) => parsed.domain === legit || parsed.domain.endsWith("." + legit)
    );
    if (!isLegitimate) {
      const pathMatchesBrand = target.aliases.some((alias) =>
        lowerPath.includes(alias)
      );
      if (pathMatchesBrand) {
        pathQueryRisk += 18;
        riskFactors.push({
          source: "Local URL Analysis",
          category: "Path Brand Spoofing",
          reason: `URL path embeds target brand '${target.name}' on unrelated host '${parsed.domain}' (simulated domain or credential harvesting path)`,
          severity: "HIGH",
          scoreContribution: 18,
        });
        findings.push({
          category: "Path Analysis",
          severity: "HIGH",
          description: `URL path embeds brand '${target.name.toUpperCase()}' (${parsed.path}) on unrelated domain '${parsed.domain}'. This is a known phishing evasion and credential harvesting tactic.`,
        });
        break;
      }
    }
  }

  // Check if path simulates a domain/FQDN hierarchy (e.g. /www.online.domain.com/...)
  if (/\/(www\.|[a-zA-Z0-9-]+\.(com|net|org|co|io|app|info|xyz|online|biz))\//i.test(parsed.path)) {
    pathQueryRisk += 10;
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Simulated Host in Path",
      reason: `URL path simulates an embedded fully qualified domain name inside the path`,
      severity: "HIGH",
      scoreContribution: 10,
    });
    findings.push({
      category: "Path Analysis",
      severity: "HIGH",
      description: `URL path contains simulated host/domain hierarchy (${parsed.path}).`,
    });
  }

  // IP + Login Form Combo Signal
  if (parsed.isIPBased && pathKeywords.length > 0) {
    pathQueryRisk += 8;
    riskFactors.push({
      source: "Local URL Analysis",
      category: "Direct IP Authentication",
      reason: `High-risk combination: Direct IP hosting an unverified authentication endpoint (${pathKeywords.join(", ")})`,
      severity: "HIGH",
      scoreContribution: 8,
    });
  }

  pathQueryRisk = Math.min(35, pathQueryRisk);

  // Calculate Local Composite Score (0-100)
  const localScore = Math.min(100, Math.round(urlStructuralRisk + domainCharacteristicRisk + pathQueryRisk));

  const urlCharacteristics: URLAnalysisResult["urlCharacteristics"] = {
    usesHTTPS: parsed.protocol === "https",
    hasExcessiveLength,
    hasMultipleSubdomains,
    hasIPAddress: parsed.isIPBased,
    hasSuspiciousPort: isSuspiciousPort,
    hasURLEncoding,
    hasObfuscatedCharacters: hasObfuscatedChars,
    hasExcessiveRedirects: false,
    hasHighEntropy,
    hasSuspiciousQuery: suspiciousQueryParams.length > 0,
    redirectionChain: [],
    issues: urlIssues,
  };

  const domainCharacteristics: URLAnalysisResult["domainCharacteristics"] = {
    hasPunycode,
    hasSuspiciousTLD: isSuspiciousTLD,
    hasExcessiveHyphens,
    lookalikeDomains: lookalikes,
    brandImpersonationDetected: isImpersonating,
    impersonatedBrand,
    suspiciousKeywords: domainKeywords,
    domainAge: null,
    issues: domainIssues,
  };

  return {
    urlCharacteristics,
    domainCharacteristics,
    pathQueryCharacteristics: {
      suspiciousPathKeywords: pathKeywords,
      suspiciousQueryParams,
      hasOpenRedirect,
    },
    riskFactors,
    findings,
    localScore,
    breakdown: {
      urlStructuralRisk: Math.round(urlStructuralRisk),
      domainCharacteristicRisk: Math.round(domainCharacteristicRisk),
      pathQueryRisk: Math.round(pathQueryRisk),
    },
  };
}

function hasSuspiciousPort(port: number | null): boolean {
  if (!port) return false;
  const standardPorts = [80, 443];
  const suspiciousPorts = [
    21, 22, 23, 25, 53, 110, 135, 139, 143, 445, 587, 993, 995, 1433,
    1521, 3306, 3389, 5432, 5900, 6379, 7001, 8080, 8443, 8888, 9200, 27017,
  ];
  return !standardPorts.includes(port) || suspiciousPorts.includes(port);
}

function hasObfuscatedCharacters(url: string): boolean {
  const patterns = [
    /[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}/,
    /\\x[0-9a-fA-F]{2}/,
    /\\u[0-9a-fA-F]{4}/,
    /@.+/,
    /\/\/.+\/\//,
  ];
  return patterns.some((p) => p.test(url));
}

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const allKeywords = [
    ...AUTH_CREDENTIAL_KEYWORDS,
    ...VERIFICATION_SECURITY_KEYWORDS,
    ...BILLING_PAYMENT_KEYWORDS,
    ...URGENCY_ACTION_KEYWORDS,
  ];
  const matched = new Set<string>();
  for (const kw of allKeywords) {
    if (lower.includes(kw)) {
      matched.add(kw);
    }
  }
  return Array.from(matched);
}

function checkBrandImpersonation(parsed: URLParseResult): {
  impersonatedBrand: string | null;
  isImpersonating: boolean;
  lookalikes: string[];
} {
  const hostname = parsed.hostname.toLowerCase();
  const domain = parsed.domain.toLowerCase();
  const subdomain = (parsed.subdomain || "").toLowerCase();

  const lookalikes: string[] = [];
  let impersonatedBrand: string | null = null;
  let isImpersonating = false;

  for (const target of TARGET_BRANDS) {
    // Check if domain is legitimately owned by this brand
    const isLegitimate = target.legitimateDomains.some(
      (legit) => domain === legit || domain.endsWith("." + legit)
    );

    if (isLegitimate) {
      continue; // Clean official domain
    }

    const subdomainTokens = subdomain.split(/[-._0-9]+/).filter(Boolean);
    const hostnameTokens = hostname.split(/[-._0-9]+/).filter(Boolean);

    // Exact or compound match
    const matchesBrand = target.aliases.some((alias) => {
      if (alias.length <= 3) {
        return (
          subdomainTokens.includes(alias) ||
          (hostnameTokens.includes(alias) && !domain.startsWith(alias))
        );
      }
      return (
        subdomainTokens.includes(alias) ||
        subdomain.includes(alias) ||
        (hostname.includes(alias) && !domain.startsWith(alias))
      );
    });

    if (matchesBrand) {
      impersonatedBrand = target.name;
      isImpersonating = true;
      break;
    }

    // Check for lookalike/typosquatting
    const sld = domain.split(".")[0];
    if (
      target.aliases.some(
        (alias) => alias.length >= 4 && alias !== target.name && sld.includes(alias)
      )
    ) {
      lookalikes.push(target.name);
    }
  }

  return { impersonatedBrand, isImpersonating, lookalikes };
}

export const CLOUDMERSIVE_ERROR_STATUSES = new Set([
  "unabletoconnect",
  "forcedabort",
  "invalidinput",
  "error",
  "timeout",
  "networkerror",
  "econnreset",
  "econnrefused",
  "enotfound",
  "etimedout",
  "unreachable",
  "blocked",
]);

export const CLOUDMERSIVE_THREAT_STATUSES = new Set([
  "malware",
  "phishing",
  "unwantedsoftware",
  "executables",
  "viruses",
  "trojan",
  "ransomware",
  "spyware",
]);

export function classifyTarget(parsed: URLParseResult): TargetClassification {
  if (parsed.isIPBased) return "ip";
  if ((parsed.path && parsed.path !== "/" && parsed.path.length > 1) || (parsed.query && parsed.query.length > 0)) {
    return "url";
  }
  return "domain";
}

/**
 * Structurally enforce the invariant that only status === "threat" contributes risk.
 */
export function aggregateProviderRisk(
  provider: Pick<NormalizedProviderResult, "provider" | "status" | "scoreContribution">
): number {
  return provider.status === "threat" ? Math.max(0, provider.scoreContribution) : 0;
}

/**
 * Normalize raw threat intelligence provider responses into uniform NormalizedProviderResult objects.
 */
export function normalizeProviderResults(
  threatIntelligence: URLAnalysisResult["threatIntelligence"],
  explicitResults?: Record<string, NormalizedProviderResult>
): Record<string, NormalizedProviderResult> {
  if (explicitResults && Object.keys(explicitResults).length > 0) {
    return { ...explicitResults };
  }
  const normalized: Record<string, NormalizedProviderResult> = {};

  // 1. VirusTotal
  if (!normalized["VirusTotal"] && threatIntelligence.virusTotal) {
    const vt = threatIntelligence.virusTotal;
    if (vt.maliciousEngines > 0) {
      const score = Math.min(50, vt.maliciousEngines * 10 + (vt.suspiciousEngines || 0) * 3);
      normalized["VirusTotal"] = {
        provider: "VirusTotal",
        status: "threat",
        evidence: [
          `Flagged as malicious by ${vt.maliciousEngines} security vendor${vt.maliciousEngines > 1 ? "s" : ""}`,
          `Harmless: ${vt.harmlessEngines}, Undetected: ${vt.undetectedEngines}${vt.suspiciousEngines > 0 ? `, Suspicious: ${vt.suspiciousEngines}` : ""}`,
        ],
        scoreContribution: score,
        relevance: "exact",
        details: {
          malicious: vt.maliciousEngines,
          suspicious: vt.suspiciousEngines,
          harmless: vt.harmlessEngines,
          undetected: vt.undetectedEngines,
          reputation: vt.reputation,
          scanDate: vt.lastAnalysisDate,
        },
      };
    } else if (vt.suspiciousEngines > 0) {
      normalized["VirusTotal"] = {
        provider: "VirusTotal",
        status: "threat",
        evidence: [
          `Flagged as suspicious by ${vt.suspiciousEngines} security vendor${vt.suspiciousEngines > 1 ? "s" : ""}`,
          `Harmless: ${vt.harmlessEngines}, Undetected: ${vt.undetectedEngines}`,
        ],
        scoreContribution: 20,
        relevance: "exact",
        details: {
          malicious: vt.maliciousEngines,
          suspicious: vt.suspiciousEngines,
          harmless: vt.harmlessEngines,
          undetected: vt.undetectedEngines,
          reputation: vt.reputation,
          scanDate: vt.lastAnalysisDate,
        },
      };
    } else if (vt.reputation < -20) {
      normalized["VirusTotal"] = {
        provider: "VirusTotal",
        status: "threat",
        evidence: [`Poor vendor reputation score (${vt.reputation})`],
        scoreContribution: Math.min(40, Math.abs(vt.reputation)),
        relevance: "exact",
        details: {
          malicious: vt.maliciousEngines,
          suspicious: vt.suspiciousEngines,
          harmless: vt.harmlessEngines,
          undetected: vt.undetectedEngines,
          reputation: vt.reputation,
          scanDate: vt.lastAnalysisDate,
        },
      };
    } else {
      normalized["VirusTotal"] = {
        provider: "VirusTotal",
        status: "clean",
        evidence: [`Clean vendor reputation: 0 / ${vt.harmlessEngines + vt.undetectedEngines} vendors flagged malicious`],
        scoreContribution: 0,
        relevance: "exact",
        details: {
          malicious: 0,
          suspicious: 0,
          harmless: vt.harmlessEngines,
          undetected: vt.undetectedEngines,
          reputation: vt.reputation,
          scanDate: vt.lastAnalysisDate,
        },
      };
    }
  }

  // 2. Cloudmersive
  if (!normalized["Cloudmersive"] && threatIntelligence.cloudmersive) {
    const cm = threatIntelligence.cloudmersive;
    const rawType = (cm.websiteThreatType || "").trim();
    const typeLower = rawType.toLowerCase();

    if (CLOUDMERSIVE_ERROR_STATUSES.has(typeLower)) {
      normalized["Cloudmersive"] = {
        provider: "Cloudmersive",
        status: "error",
        error: rawType || "Unable to connect to target server",
        evidence: [],
        scoreContribution: 0,
        details: { websiteThreatType: rawType },
      };
    } else if (cm.foundViruses && cm.foundViruses.length > 0) {
      const virusList = cm.foundViruses.map((v) => v.virusName).filter(Boolean).join(", ");
      normalized["Cloudmersive"] = {
        provider: "Cloudmersive",
        status: "threat",
        evidence: [`Anti-virus scanner detected viruses: ${virusList || "Malware found"}`],
        scoreContribution: 80,
        relevance: "exact",
        details: { websiteThreatType: rawType, foundViruses: cm.foundViruses },
      };
    } else if (CLOUDMERSIVE_THREAT_STATUSES.has(typeLower)) {
      normalized["Cloudmersive"] = {
        provider: "Cloudmersive",
        status: "threat",
        evidence: [`Threat detection identified: ${rawType}`],
        scoreContribution: 80,
        relevance: "exact",
        details: { websiteThreatType: rawType },
      };
    } else if (cm.cleanResult === true || typeLower === "none" || typeLower === "") {
      normalized["Cloudmersive"] = {
        provider: "Cloudmersive",
        status: "clean",
        evidence: ["Clean anti-virus and web threat scan (0 viruses found)"],
        scoreContribution: 0,
        relevance: "exact",
        details: { cleanResult: true, websiteThreatType: "None" },
      };
    } else {
      normalized["Cloudmersive"] = {
        provider: "Cloudmersive",
        status: "unknown",
        error: rawType,
        evidence: [`Indeterminate response: ${rawType}`],
        scoreContribution: 0,
        details: { websiteThreatType: rawType },
      };
    }
  }



  // 4. Criminal IP
  if (!normalized["Criminal IP"] && threatIntelligence.criminalIP) {
    const cip = threatIntelligence.criminalIP;
    const phishing = cip.phishingScore ?? 0;
    const malware = cip.malwareScore ?? 0;
    const cipMax = Math.max(phishing, malware);
    if (cipMax > 0) {
      normalized["Criminal IP"] = {
        provider: "Criminal IP",
        status: "threat",
        evidence: [
          `Risk assessment: ${phishing > 0 ? `Phishing ${phishing}%` : `Malware ${malware}%`}`,
          ...(cip.technologies && cip.technologies.length > 0 ? [`Technologies: ${cip.technologies.slice(0, 4).join(", ")}`] : []),
        ],
        scoreContribution: cipMax,
        relevance: "exact",
        details: {
          riskScore: cip.riskScore,
          phishingScore: cip.phishingScore,
          malwareScore: cip.malwareScore,
          technologies: cip.technologies,
        },
      };
    } else {
      normalized["Criminal IP"] = {
        provider: "Criminal IP",
        status: "clean",
        evidence: ["Clean threat assessment (0% phishing, 0% malware)"],
        scoreContribution: 0,
        details: { phishingScore: 0, malwareScore: 0, riskScore: cip.riskScore ?? 0 },
      };
    }
  }

  // 5. Abusix
  if (!normalized["Abusix"] && threatIntelligence.abusix) {
    const ab = threatIntelligence.abusix;
    if (ab.listed) {
      normalized["Abusix"] = {
        provider: "Abusix",
        status: "threat",
        evidence: [
          `Listed on Abusix threat intelligence blocklist (${ab.threatLevel})`,
          ...(ab.categories && ab.categories.length > 0 ? [`Categories: ${ab.categories.join(", ")}`] : []),
        ],
        scoreContribution: 75,
        relevance: "exact",
        details: {
          listed: ab.listed,
          threatLevel: ab.threatLevel,
          categories: ab.categories,
        },
      };
    } else {
      normalized["Abusix"] = {
        provider: "Abusix",
        status: "clean",
        evidence: ["Target host IP is not listed on any Abusix threat blocklists"],
        scoreContribution: 0,
        details: { listed: false },
      };
    }
  }

  // 6. AbuseIPDB
  if (!normalized["AbuseIPDB"] && threatIntelligence.abuseScore !== null && threatIntelligence.abuseScore !== undefined) {
    const score = threatIntelligence.abuseScore;
    if (score >= 25) {
      normalized["AbuseIPDB"] = {
        provider: "AbuseIPDB",
        status: "threat",
        evidence: [`Abuse confidence score: ${score}% from community reports`],
        scoreContribution: score,
        relevance: "exact",
        details: { abuseConfidenceScore: score },
      };
    } else {
      normalized["AbuseIPDB"] = {
        provider: "AbuseIPDB",
        status: "clean",
        evidence: [`Clean IP reputation: ${score}% abuse confidence (below threat threshold)`],
        scoreContribution: 0,
        details: { abuseConfidenceScore: score },
      };
    }
  }

  // 7. CheckPhish.ai
  if (!normalized["CheckPhish.ai"] && threatIntelligence.checkphish) {
    const cp = threatIntelligence.checkphish;
    if (cp.disposition === "phish") {
      normalized["CheckPhish.ai"] = {
        provider: "CheckPhish.ai",
        status: "threat",
        evidence: [
          `AI neural model classified URL as active Phishing${cp.brand ? ` (Target: ${cp.brand})` : ""}`,
          ...(cp.insights ? [cp.insights] : []),
        ],
        scoreContribution: 85,
        relevance: "exact",
        details: {
          disposition: cp.disposition,
          brand: cp.brand,
          insights: cp.insights,
          screenshotUrl: cp.screenshotUrl,
        },
      };
    } else if (cp.disposition === "suspicious") {
      normalized["CheckPhish.ai"] = {
        provider: "CheckPhish.ai",
        status: "threat",
        evidence: [`AI flagged URL as suspicious behavior`],
        scoreContribution: 60,
        relevance: "exact",
        details: {
          disposition: cp.disposition,
          brand: cp.brand,
          insights: cp.insights,
          screenshotUrl: cp.screenshotUrl,
        },
      };
    } else if (cp.disposition === "clean") {
      normalized["CheckPhish.ai"] = {
        provider: "CheckPhish.ai",
        status: "clean",
        evidence: ["AI neural model confirmed clean disposition"],
        scoreContribution: 0,
        details: { disposition: "clean" },
      };
    } else {
      normalized["CheckPhish.ai"] = {
        provider: "CheckPhish.ai",
        status: "unknown",
        evidence: ["AI scan response was inconclusive or pending analysis"],
        scoreContribution: 0,
        details: { disposition: cp.disposition },
      };
    }
  }

  // 8. urlscan.io
  if (!normalized["urlscan.io"] && threatIntelligence.urlscan) {
    const us = threatIntelligence.urlscan;
    if (us.malicious || us.score >= 50) {
      const score = Math.max(75, us.score);
      normalized["urlscan.io"] = {
        provider: "urlscan.io",
        status: "threat",
        evidence: [
          `Automated sandbox flagged target as malicious (Score: ${us.score}/100)`,
          ...(us.technologies && us.technologies.length > 0 ? [`Technologies: ${us.technologies.slice(0, 4).join(", ")}`] : []),
        ],
        scoreContribution: score,
        relevance: "exact",
        details: {
          score: us.score,
          malicious: us.malicious,
          categories: us.categories,
          technologies: us.technologies,
          screenshotUrl: us.screenshotUrl,
          reportUrl: us.reportUrl,
        },
      };
    } else {
      normalized["urlscan.io"] = {
        provider: "urlscan.io",
        status: "clean",
        evidence: [`Sandbox analysis clean (Score: ${us.score}/100)`],
        scoreContribution: 0,
        details: {
          score: us.score,
          malicious: false,
          technologies: us.technologies,
          reportUrl: us.reportUrl,
        },
      };
    }
  }

  // 9. PhishStats
  if (!normalized["PhishStats"] && threatIntelligence.phishstats) {
    const ps = threatIntelligence.phishstats;
    if (ps.score >= 4) {
      const score = Math.min(100, Math.round(ps.score * 10));
      normalized["PhishStats"] = {
        provider: "PhishStats",
        status: "threat",
        evidence: [
          `Phishing threat rating: ${ps.score.toFixed(1)}/10.0${ps.targetBrand ? ` targeting ${ps.targetBrand}` : ""}`,
          ...(ps.tags && ps.tags.length > 0 ? [`Threat tags: ${ps.tags.slice(0, 3).join(", ")}`] : []),
        ],
        scoreContribution: score,
        relevance: "exact",
        details: {
          score: ps.score,
          tags: ps.tags,
          targetBrand: ps.targetBrand,
          threatType: ps.threatType,
        },
      };
    } else {
      normalized["PhishStats"] = {
        provider: "PhishStats",
        status: "clean",
        evidence: ["Target not listed in live phishing feeds"],
        scoreContribution: 0,
        details: { score: ps.score },
      };
    }
  }

  // 10. alphaMountain.ai
  if (!normalized["alphaMountain.ai"] && threatIntelligence.alphaMountain) {
    const am = threatIntelligence.alphaMountain;
    if (am.riskScore >= 25) {
      normalized["alphaMountain.ai"] = {
        provider: "alphaMountain.ai",
        status: "threat",
        evidence: [`AI threat rating: ${am.threatScore.toFixed(2)}/5.0 (${am.riskScore}% risk score)`],
        scoreContribution: am.riskScore,
        relevance: "exact",
        details: {
          threatScore: am.threatScore,
          riskScore: am.riskScore,
          categories: am.categories,
          confidence: am.confidence,
          source: am.source,
        },
      };
    } else {
      normalized["alphaMountain.ai"] = {
        provider: "alphaMountain.ai",
        status: "clean",
        evidence: [`Low AI risk score (${am.riskScore}%, rating: ${am.threatScore.toFixed(2)}/5.0)`],
        scoreContribution: 0,
        details: {
          threatScore: am.threatScore,
          riskScore: am.riskScore,
          confidence: am.confidence,
        },
      };
    }
  }

  // 11. Yandex Safe Browsing
  if (!normalized["Yandex Safe Browsing"] && threatIntelligence.yandex) {
    const yx = threatIntelligence.yandex;
    if (!yx.isSafe && yx.matches.length > 0) {
      const types = yx.matches.map((m) => m.threatType).join(", ");
      normalized["Yandex Safe Browsing"] = {
        provider: "Yandex Safe Browsing",
        status: "threat",
        evidence: [`Flagged as unsafe by Yandex Safe Browsing: ${types}`],
        scoreContribution: 80,
        relevance: "exact",
        details: { isSafe: false, matches: yx.matches },
      };
    } else {
      normalized["Yandex Safe Browsing"] = {
        provider: "Yandex Safe Browsing",
        status: "clean",
        evidence: ["No malware or phishing matches in Yandex index"],
        scoreContribution: 0,
        details: { isSafe: true, matches: [] },
      };
    }
  }

  // 12. Google Safe Browsing
  if (!normalized["Google Safe Browsing"] && threatIntelligence.googleSafeBrowsing) {
    const gsb = threatIntelligence.googleSafeBrowsing;
    if (gsb.isThreat && gsb.threatTypes && gsb.threatTypes.length > 0) {
      const types = gsb.threatTypes.join(", ");
      normalized["Google Safe Browsing"] = {
        provider: "Google Safe Browsing",
        status: "threat",
        evidence: [`Flagged on Google Safe Browsing lists: ${types}`],
        scoreContribution: 85,
        relevance: "exact",
        details: { isSafe: false, isThreat: true, threatTypes: gsb.threatTypes, platformTypes: gsb.platformTypes },
      };
    } else {
      normalized["Google Safe Browsing"] = {
        provider: "Google Safe Browsing",
        status: "clean",
        evidence: ["Target not listed on Google Safe Browsing lists"],
        scoreContribution: 0,
        details: { isSafe: true, isThreat: false, threatTypes: [] },
      };
    }
  }

  // 12. VXVault Live Malware Feed
  if (!normalized["VXVault Threat Feed"] && threatIntelligence.vxvault) {
    const vx = threatIntelligence.vxvault;
    if (vx.listed) {
      normalized["VXVault Threat Feed"] = {
        provider: "VXVault Threat Feed",
        status: "threat",
        evidence: [`Actively listed on VXVault malware distribution feed${vx.matchUrl ? ` (${vx.matchUrl})` : ""}`],
        scoreContribution: 85,
        relevance: "exact",
        details: { listed: true, matchUrl: vx.matchUrl },
      };
    } else {
      normalized["VXVault Threat Feed"] = {
        provider: "VXVault Threat Feed",
        status: "clean",
        evidence: ["Target not present in live malware distribution database"],
        scoreContribution: 0,
        details: { listed: false },
      };
    }
  }

  // 13. IPStack
  if (!normalized["IPStack"] && threatIntelligence.ipstack) {
    const ips = threatIntelligence.ipstack;
    const isHigh = ips.threatLevel === "high" || ips.threatLevel === "critical";
    if (isHigh) {
      normalized["IPStack"] = {
        provider: "IPStack",
        status: "threat",
        evidence: [`Flagged infrastructure with elevated threat level (${ips.threatLevel})`],
        scoreContribution: 65,
        relevance: "exact",
        details: {
          countryName: ips.countryName,
          threatLevel: ips.threatLevel,
          isProxy: ips.isProxy,
          isTor: ips.isTor,
        },
      };
    } else if (ips.isTor || ips.isProxy) {
      normalized["IPStack"] = {
        provider: "IPStack",
        status: "threat",
        evidence: [`Host IP identified as active ${ips.isTor ? "Tor node" : "Proxy/Anonymizer"}`],
        scoreContribution: 35,
        relevance: "exact",
        details: {
          countryName: ips.countryName,
          threatLevel: ips.threatLevel,
          isProxy: ips.isProxy,
          isTor: ips.isTor,
        },
      };
    } else {
      normalized["IPStack"] = {
        provider: "IPStack",
        status: "clean",
        evidence: ["Standard host infrastructure (No proxy or Tor flags detected)"],
        scoreContribution: 0,
        details: { countryName: ips.countryName, isProxy: false, isTor: false },
      };
    }
  }

  // 14. URLQuery
  if (!normalized["URLQuery"] && threatIntelligence.urlquery) {
    const uq = threatIntelligence.urlquery;
    normalized["URLQuery"] = {
      provider: "URLQuery",
      status: "clean",
      evidence: uq.totalHits > 0 ? [`Found in ${uq.totalHits} previous scan report(s)`] : ["No previous malicious submissions found"],
      scoreContribution: 0,
      details: { totalHits: uq.totalHits, reportsSample: (uq.reports || []).slice(0, 3) },
    };
  }

  return normalized;
}

// ---- Unified Score Calculation ----
export function calculateUnifiedRiskScore(
  localResult: ReturnType<typeof performLocalURLAnalysis>,
  threatIntelligence: URLAnalysisResult["threatIntelligence"],
  explicitProviderResults?: Record<string, NormalizedProviderResult>
): {
  totalScore: number;
  verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  severity: "info" | "low" | "medium" | "high" | "critical";
  sources: string[];
  allRiskFactors: RiskFactor[];
  breakdown: URLAnalysisResult["riskBreakdown"];
  providerResults: Record<string, NormalizedProviderResult>;
  coverage: AnalysisCoverage;
} {
  const sources: string[] = [];
  const allRiskFactors: RiskFactor[] = [];
  const providerResults = normalizeProviderResults(threatIntelligence, explicitProviderResults);
  delete providerResults["AlienVault OTX"];

  let threatIntelRisk = 0;
  let threatsCount = 0;
  let cleanCount = 0;
  let errorsCount = 0;
  let timeoutsCount = 0;
  let unavailableCount = 0;
  let unknownCount = 0;

  for (const [providerName, pResult] of Object.entries(providerResults)) {
    if (providerName === "AlienVault OTX" || providerName === "Local URL Analysis") continue;
    sources.push(providerName);

    // Track status counts for coverage
    switch (pResult.status) {
      case "threat":
        threatsCount++;
        break;
      case "clean":
        cleanCount++;
        break;
      case "error":
        errorsCount++;
        break;
      case "timeout":
        timeoutsCount++;
        break;
      case "unavailable":
        unavailableCount++;
        break;
      case "unknown":
        unknownCount++;
        break;
    }

    // STRUCTURAL INVARIANT:
    // Only accumulate risk points if status is STRICTLY "threat".
    // Error, clean, timeout, unavailable, or unknown unconditionally contribute 0.
    const contribution = aggregateProviderRisk(pResult);

    if (contribution > 0) {
      threatIntelRisk = Math.max(threatIntelRisk, contribution);
      allRiskFactors.push({
        source: providerName as RiskFactor["source"],
        category: pResult.relevance === "historical" ? "Historical Threat Pulse" : "Threat Intelligence",
        reason: pResult.evidence[0] || `${providerName} detected threat (Score: ${contribution})`,
        severity: contribution >= 75 ? "CRITICAL" : contribution >= 50 ? "HIGH" : "MEDIUM",
        scoreContribution: contribution,
      });
    }
  }

  const totalRelevant = Object.keys(providerResults).length;
  const responded = threatsCount + cleanCount;
  const coveragePercentage = totalRelevant > 0 ? Math.round((responded / totalRelevant) * 100) : 100;
  const coverage: AnalysisCoverage = {
    totalRelevant,
    responded,
    threats: threatsCount,
    clean: cleanCount,
    errors: errorsCount,
    timeouts: timeoutsCount,
    unavailable: unavailableCount,
    unknown: unknownCount,
    percentage: coveragePercentage,
  };

  // Composite Unified Risk Score (derived purely from threat intelligence engines):
  const totalScore = Math.min(100, Math.round(threatIntelRisk));

  // Verdict & Threat Level
  let verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS" = "SAFE";
  let threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  let severity: "info" | "low" | "medium" | "high" | "critical" = "info";

  if (totalScore >= 75) {
    verdict = "MALICIOUS";
    threatLevel = "CRITICAL";
    severity = "critical";
  } else if (totalScore >= 55) {
    verdict = "SUSPICIOUS";
    threatLevel = "HIGH";
    severity = "high";
  } else if (totalScore >= 35) {
    verdict = "SUSPICIOUS";
    threatLevel = "MEDIUM";
    severity = "medium";
  } else if (totalScore >= 15) {
    verdict = "SAFE";
    threatLevel = "LOW";
    severity = "low";
  } else {
    verdict = "SAFE";
    threatLevel = "LOW";
    severity = "info";
  }

  return {
    totalScore,
    verdict,
    threatLevel,
    severity,
    sources,
    allRiskFactors,
    breakdown: {
      localHeuristicRisk: 0,
      urlStructuralRisk: 0,
      domainCharacteristicRisk: 0,
      pathQueryRisk: 0,
      threatIntelligenceRisk: Math.round(threatIntelRisk),
      totalRisk: totalScore,
    },
    providerResults,
    coverage,
  };
}

// Backward compatibility helper
export function calculateRiskScore(
  urlCharacteristics: URLAnalysisResult["urlCharacteristics"],
  domainCharacteristics: URLAnalysisResult["domainCharacteristics"],
  threatIntelligence: URLAnalysisResult["threatIntelligence"]
) {
  let urlStructuralRisk = 0;
  if (!urlCharacteristics.usesHTTPS) urlStructuralRisk += 5;
  if (urlCharacteristics.hasExcessiveLength) urlStructuralRisk += 4;
  if (urlCharacteristics.hasMultipleSubdomains) urlStructuralRisk += 8;
  if (urlCharacteristics.hasIPAddress) urlStructuralRisk += 15;
  if (urlCharacteristics.hasSuspiciousPort) urlStructuralRisk += 10;
  if (urlCharacteristics.hasURLEncoding) urlStructuralRisk += 4;
  if (urlCharacteristics.hasObfuscatedCharacters) urlStructuralRisk += 8;
  urlStructuralRisk = Math.min(25, urlStructuralRisk);

  let domainCharacteristicRisk = 0;
  if (domainCharacteristics.hasPunycode) domainCharacteristicRisk += 15;
  if (domainCharacteristics.hasSuspiciousTLD) domainCharacteristicRisk += 10;
  if (domainCharacteristics.hasExcessiveHyphens) domainCharacteristicRisk += 8;
  if (domainCharacteristics.brandImpersonationDetected) domainCharacteristicRisk += 30;
  domainCharacteristicRisk += domainCharacteristics.lookalikeDomains.length * 15;
  domainCharacteristicRisk = Math.min(40, domainCharacteristicRisk);

  let threatIntelligenceRisk = 0;
  if (threatIntelligence.isKnownMalicious) threatIntelligenceRisk += 35;
  if (threatIntelligence.virusTotal) {
    threatIntelligenceRisk += (threatIntelligence.virusTotal.maliciousEngines || 0) * 8;
    threatIntelligenceRisk += (threatIntelligence.virusTotal.suspiciousEngines || 0) * 2;
  }
  if (threatIntelligence.abuseScore && threatIntelligence.abuseScore > 40) {
    threatIntelligenceRisk += 20;
  }
  threatIntelligenceRisk = Math.min(40, threatIntelligenceRisk);

  const totalScore = Math.min(100, Math.round(urlStructuralRisk + domainCharacteristicRisk + threatIntelligenceRisk));
  return {
    totalScore,
    breakdown: {
      localHeuristicRisk: Math.round(urlStructuralRisk + domainCharacteristicRisk),
      urlStructuralRisk: Math.round(urlStructuralRisk),
      domainCharacteristicRisk: Math.round(domainCharacteristicRisk),
      pathQueryRisk: 0,
      threatIntelligenceRisk: Math.round(threatIntelligenceRisk),
      totalRisk: totalScore,
    },
  };
}

export function scoreToVerdict(score: number): {
  verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
} {
  if (score >= 75) return { verdict: "MALICIOUS", threatLevel: "CRITICAL" };
  if (score >= 55) return { verdict: "SUSPICIOUS", threatLevel: "HIGH" };
  if (score >= 35) return { verdict: "SUSPICIOUS", threatLevel: "MEDIUM" };
  return { verdict: "SAFE", threatLevel: "LOW" };
}
