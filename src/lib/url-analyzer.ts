// ============================================
// XEROVA — Malicious URL & Website Analyzer
// ============================================
// Advanced URL analysis pipeline:
// URL Parser → Structural Analysis → Suspicious Pattern Detection
// → Domain Analysis → Threat Intelligence → Risk Score → Verdict

// ---- URL Analysis Types ----
export interface URLAnalysisResult {
  url: string;
  verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  riskScore: number; // 0-100
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  
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
    suspiciousKeywords: string[];
    domainAge: number | null; // days
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
    abuseScore: number | null;
    isKnownMalicious: boolean;
    suspiciousReports: number;
  };
  
  // Risk Scoring Breakdown
  riskBreakdown: {
    urlStructuralRisk: number;
    domainCharacteristicRisk: number;
    threatIntelligenceRisk: number;
    totalRisk: number;
  };
  
  // Detailed Findings
  findings: Array<{
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
  }>;
}

export interface URLParseResult {
  url: string;
  protocol: "http" | "https" | "unknown";
  hostname: string;
  domain: string;
  port: number | null;
  path: string;
  query: string;
  subdomain: string | null;
  isIPBased: boolean;
  ipAddress: string | null;
  urlLength: number;
  error?: string;
}

// ---- URL Parsing ----
export function parseURL(urlString: string): URLParseResult {
  try {
    const url = new URL(urlString);
    
    const protocol = 
      url.protocol === "https:" ? "https" :
      url.protocol === "http:" ? "http" :
      "unknown";
    
    const hostname = url.hostname || "";
    const port = url.port ? parseInt(url.port, 10) : null;
    const path = url.pathname || "/";
    const query = url.search || "";
    
    // Detect IP address
    const isIPBased = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(hostname);
    
    // Extract domain and subdomain
    const parts = hostname.split(".");
    const domain = parts.slice(-2).join("."); // TLD + primary domain
    const subdomain = parts.length > 2 ? parts.slice(0, -2).join(".") : null;
    
    return {
      url: urlString,
      protocol,
      hostname,
      domain,
      port,
      path,
      query,
      subdomain,
      isIPBased,
      ipAddress: isIPBased ? hostname : null,
      urlLength: urlString.length,
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
      subdomain: null,
      isIPBased: false,
      ipAddress: null,
      urlLength: urlString.length,
      error: `Failed to parse URL: ${(e as Error).message}`,
    };
  }
}

// ---- Suspicious URL Characteristics ----
export function analyzeURLCharacteristics(
  parsed: URLParseResult
): { characteristics: URLAnalysisResult["urlCharacteristics"]; findings: Array<{category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; description: string}> } {
  const characteristics: URLAnalysisResult["urlCharacteristics"] = {
    usesHTTPS: parsed.protocol === "https",
    hasExcessiveLength: parsed.urlLength > 75,
    hasMultipleSubdomains: (parsed.subdomain?.split(".").length ?? 0) > 2,
    hasIPAddress: parsed.isIPBased,
    hasSuspiciousPort: hasSuspiciousPort(parsed.port),
    hasURLEncoding: /%[0-9A-Fa-f]{2}/.test(parsed.url),
    hasObfuscatedCharacters: hasObfuscatedCharacters(parsed.url),
    hasExcessiveRedirects: false, // Will be set by threat intelligence
    redirectionChain: [],
    issues: [],
  };
  
  const findings: Array<{category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; description: string}> = [];
  
  if (!characteristics.usesHTTPS) {
    findings.push({
      category: "Protocol",
      severity: "MEDIUM",
      description: "URL uses HTTP instead of HTTPS. Data may be unencrypted.",
    });
    characteristics.issues.push("HTTP protocol (not HTTPS)");
  }
  
  if (characteristics.hasExcessiveLength) {
    findings.push({
      category: "URL Structure",
      severity: "MEDIUM",
      description: `URL is ${parsed.urlLength} characters long (threshold: 75). Excessively long URLs can hide malicious content.`,
    });
    characteristics.issues.push(`Excessive URL length (${parsed.urlLength} chars)`);
  }
  
  if (characteristics.hasMultipleSubdomains) {
    findings.push({
      category: "URL Structure",
      severity: "MEDIUM",
      description: `URL has multiple subdomains (${parsed.subdomain}). Often used in phishing attempts.`,
    });
    characteristics.issues.push("Multiple subdomains");
  }
  
  if (characteristics.hasIPAddress) {
    findings.push({
      category: "URL Structure",
      severity: "HIGH",
      description: `URL uses IP address (${parsed.ipAddress}) instead of domain name. Uncommon in legitimate services.`,
    });
    characteristics.issues.push("IP-based URL instead of domain");
  }
  
  if (characteristics.hasSuspiciousPort) {
    findings.push({
      category: "Port",
      severity: "HIGH",
      description: `URL uses suspicious port ${parsed.port}. This port is not standard for HTTP/HTTPS.`,
    });
    characteristics.issues.push(`Suspicious port: ${parsed.port}`);
  }
  
  if (characteristics.hasURLEncoding) {
    findings.push({
      category: "Obfuscation",
      severity: "MEDIUM",
      description: "URL contains URL encoding (e.g., %20). May be used to obfuscate malicious content.",
    });
    characteristics.issues.push("URL encoding detected");
  }
  
  if (characteristics.hasObfuscatedCharacters) {
    findings.push({
      category: "Obfuscation",
      severity: "HIGH",
      description: "URL contains unusual characters or obfuscation techniques to evade detection.",
    });
    characteristics.issues.push("Obfuscated characters detected");
  }
  
  return { characteristics, findings };
}

function hasSuspiciousPort(port: number | null): boolean {
  if (!port) return false;
  // Flag non-standard HTTP/HTTPS ports
  const standardPorts = [80, 443];
  const maliciousPorts = [
    22, 23, 25, 53, 110, 143, 587, 993, 995, 3306, 3389, 5432, 5900, 8080,
    8443, 9200, 9300, 27017, 27018, 50070,
  ];
  return !standardPorts.includes(port) || maliciousPorts.includes(port);
}

function hasObfuscatedCharacters(url: string): boolean {
  // Check for confusing characters commonly used in obfuscation
  const patterns = [
    /[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}/, // IP in decimal
    /\\x[0-9a-fA-F]{2}/, // Hex encoding
    /\\u[0-9a-fA-F]{4}/, // Unicode escapes
  ];
  return patterns.some(p => p.test(url));
}

// ---- Suspicious Domain Characteristics ----
export function analyzeDomainCharacteristics(
  parsed: URLParseResult
): { characteristics: URLAnalysisResult["domainCharacteristics"]; findings: Array<{category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; description: string}> } {
  const { domain, hostname } = parsed;
  
  const characteristics: URLAnalysisResult["domainCharacteristics"] = {
    hasPunycode: hostname.startsWith("xn--"),
    hasSuspiciousTLD: hasSuspiciousTLD(domain),
    hasExcessiveHyphens: (hostname.match(/-/g) || []).length > 2,
    lookalikeDomains: detectLookalikeDomains(domain),
    brandImpersonationDetected: detectBrandImpersonation(hostname),
    suspiciousKeywords: detectSuspiciousKeywords(hostname),
    domainAge: null, // Will be populated by threat intelligence
    issues: [],
  };
  
  const findings: Array<{category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; description: string}> = [];
  
  if (characteristics.hasPunycode) {
    findings.push({
      category: "Domain",
      severity: "HIGH",
      description: "Domain uses Punycode encoding (xn--). Often used in homograph attacks.",
    });
    characteristics.issues.push("Punycode domain detected");
  }
  
  if (characteristics.hasSuspiciousTLD) {
    findings.push({
      category: "Domain",
      severity: "MEDIUM",
      description: `Domain uses suspicious TLD: ${parsed.domain}. Consider researching this extension.`,
    });
    characteristics.issues.push(`Suspicious TLD: ${parsed.domain}`);
  }
  
  if (characteristics.hasExcessiveHyphens) {
    findings.push({
      category: "Domain",
      severity: "MEDIUM",
      description: `Domain contains excessive hyphens: ${hostname}. Common in phishing domains.`,
    });
    characteristics.issues.push("Excessive hyphens in domain");
  }
  
  if (characteristics.lookalikeDomains.length > 0) {
    findings.push({
      category: "Lookalike Detection",
      severity: "HIGH",
      description: `Domain may be a lookalike of: ${characteristics.lookalikeDomains.join(", ")}. Be cautious.`,
    });
    characteristics.issues.push(`Lookalike domain: ${characteristics.lookalikeDomains.join(", ")}`);
  }
  
  if (characteristics.brandImpersonationDetected) {
    findings.push({
      category: "Brand Impersonation",
      severity: "CRITICAL",
      description: `Domain appears to be impersonating a known brand. This is likely a phishing attempt.`,
    });
    characteristics.issues.push("Brand impersonation detected");
  }
  
  if (characteristics.suspiciousKeywords.length > 0) {
    findings.push({
      category: "Suspicious Keywords",
      severity: "MEDIUM",
      description: `Domain contains suspicious keywords: ${characteristics.suspiciousKeywords.join(", ")}`,
    });
    characteristics.issues.push(`Suspicious keywords: ${characteristics.suspiciousKeywords.join(", ")}`);
  }
  
  return { characteristics, findings };
}

const SUSPICIOUS_TLDS = [
  "top", "tk", "ml", "ga", "cf", "gq", "xyz", "work", "download",
  "stream", "click", "science", "date", "trade", "webcam", "online",
  "website", "bid", "racing", "review", "faith", "accountant", "men",
];

function hasSuspiciousTLD(domain: string): boolean {
  const tld = domain.split(".").pop()?.toLowerCase() || "";
  return SUSPICIOUS_TLDS.includes(tld);
}

const LOOKALIKE_PATTERNS: Record<string, string[]> = {
  "google": ["googe", "goog1e", "g00gle", "qoogle", "googl3"],
  "amazon": ["amaz0n", "amazom", "amaozn"],
  "apple": ["aple", "appl3", "4pple"],
  "microsoft": ["microsft", "m1crosoft"],
  "facebook": ["fackbook", "faceb00k"],
  "twitter": ["twiiter", "twiter"],
  "paypal": ["paypa1", "paypall", "p4ypal"],
  "linkedin": ["linkedln", "linkdin"],
  "instagram": ["instaqram", "instagra1"],
  "github": ["githuv", "gittub"],
  "youtube": ["youtub3", "utube"],
};

function detectLookalikeDomains(domain: string): string[] {
  const primaryDomain = domain.split(".")[0].toLowerCase();
  const lookalikes: string[] = [];
  
  for (const [legitimate, fakes] of Object.entries(LOOKALIKE_PATTERNS)) {
    if (fakes.some(fake => primaryDomain === fake || primaryDomain.includes(fake))) {
      lookalikes.push(legitimate);
    }
  }
  
  return lookalikes;
}

const BRAND_IMPERSONATION_KEYWORDS = [
  "secure-login", "verify-account", "confirm-identity", "update-payment",
  "urgent-action", "click-here", "act-now", "limited-time",
];

function detectBrandImpersonation(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BRAND_IMPERSONATION_KEYWORDS.some(keyword => lower.includes(keyword));
}

const SUSPICIOUS_KEYWORDS = [
  "admin", "login", "secure", "verify", "confirm", "update", "payment",
  "bank", "account", "password", "urgent", "alert", "act-now", "click-here",
  "limited", "verify", "click", "unlock", "enable", "activate",
];

function detectSuspiciousKeywords(hostname: string): string[] {
  const lower = hostname.toLowerCase();
  return SUSPICIOUS_KEYWORDS.filter(keyword => lower.includes(keyword));
}

// ---- Risk Scoring ----
export function calculateRiskScore(
  urlCharacteristics: URLAnalysisResult["urlCharacteristics"],
  domainCharacteristics: URLAnalysisResult["domainCharacteristics"],
  threatIntelligence: URLAnalysisResult["threatIntelligence"]
): { totalScore: number; breakdown: URLAnalysisResult["riskBreakdown"] } {
  let urlStructuralRisk = 0;
  let domainCharacteristicRisk = 0;
  let threatIntelligenceRisk = 0;
  
  // URL Structural Risk (0-25)
  if (!urlCharacteristics.usesHTTPS) urlStructuralRisk += 5;
  if (urlCharacteristics.hasExcessiveLength) urlStructuralRisk += 4;
  if (urlCharacteristics.hasMultipleSubdomains) urlStructuralRisk += 4;
  if (urlCharacteristics.hasIPAddress) urlStructuralRisk += 10;
  if (urlCharacteristics.hasSuspiciousPort) urlStructuralRisk += 8;
  if (urlCharacteristics.hasURLEncoding) urlStructuralRisk += 3;
  if (urlCharacteristics.hasObfuscatedCharacters) urlStructuralRisk += 8;
  
  urlStructuralRisk = Math.min(urlStructuralRisk, 25);
  
  // Domain Characteristic Risk (0-35)
  if (domainCharacteristics.hasPunycode) domainCharacteristicRisk += 12;
  if (domainCharacteristics.hasSuspiciousTLD) domainCharacteristicRisk += 8;
  if (domainCharacteristics.hasExcessiveHyphens) domainCharacteristicRisk += 6;
  domainCharacteristicRisk += domainCharacteristics.lookalikeDomains.length * 10;
  if (domainCharacteristics.brandImpersonationDetected) domainCharacteristicRisk += 20;
  domainCharacteristicRisk += Math.min(domainCharacteristics.suspiciousKeywords.length * 3, 10);
  
  domainCharacteristicRisk = Math.min(domainCharacteristicRisk, 35);
  
  // Threat Intelligence Risk (0-40)
  if (threatIntelligence.isKnownMalicious) threatIntelligenceRisk += 35;
  if (threatIntelligence.virusTotal) {
    const { maliciousEngines, suspiciousEngines } = threatIntelligence.virusTotal;
    threatIntelligenceRisk += maliciousEngines * 3;
    threatIntelligenceRisk += suspiciousEngines * 1;
  }
  if (threatIntelligence.abuseScore && threatIntelligence.abuseScore > 50) {
    threatIntelligenceRisk += 15;
  }
  threatIntelligenceRisk += threatIntelligence.suspiciousReports * 2;
  
  threatIntelligenceRisk = Math.min(threatIntelligenceRisk, 40);
  
  const totalScore = Math.round(urlStructuralRisk + domainCharacteristicRisk + threatIntelligenceRisk);
  
  return {
    totalScore: Math.min(totalScore, 100),
    breakdown: {
      urlStructuralRisk: Math.round(urlStructuralRisk),
      domainCharacteristicRisk: Math.round(domainCharacteristicRisk),
      threatIntelligenceRisk: Math.round(threatIntelligenceRisk),
      totalRisk: Math.min(totalScore, 100),
    },
  };
}

export function scoreToVerdict(score: number): { verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS"; threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" } {
  if (score < 25) return { verdict: "SAFE", threatLevel: "LOW" };
  if (score < 50) return { verdict: "SUSPICIOUS", threatLevel: "MEDIUM" };
  if (score < 75) return { verdict: "SUSPICIOUS", threatLevel: "HIGH" };
  return { verdict: "MALICIOUS", threatLevel: "CRITICAL" };
}
