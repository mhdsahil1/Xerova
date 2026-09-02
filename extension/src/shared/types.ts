// ============================================
// XEROVA Browser Guard — Shared Type Definitions
// ============================================
// Mirrors the XEROVA backend URL analysis response types.
// Keep in sync with: src/lib/url-analyzer.ts (URLAnalysisResult, RiskFactor)

// --- Risk Factor ---
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
    | "VXVault Threat Feed";
  category: string;
  reason: string;
  severity: Severity;
  scoreContribution?: number;
}

// --- Severity Levels ---
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// --- Verdict ---
export type Verdict = "SAFE" | "SUSPICIOUS" | "MALICIOUS";

// --- Threat Level ---
export type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// --- Finding ---
export interface Finding {
  category: string;
  severity: Severity;
  description: string;
}

// --- Structural Analysis ---
export interface StructuralAnalysis {
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
}

// --- URL Characteristics ---
export interface URLCharacteristics {
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
}

// --- Domain Characteristics ---
export interface DomainCharacteristics {
  hasPunycode: boolean;
  hasSuspiciousTLD: boolean;
  hasExcessiveHyphens: boolean;
  lookalikeDomains: string[];
  brandImpersonationDetected: boolean;
  impersonatedBrand: string | null;
  suspiciousKeywords: string[];
  domainAge: number | null;
  issues: string[];
}

// --- Threat Intelligence ---
export interface ThreatIntelligence {
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
    pulses: Array<{ id: string; name: string; author: string; tags: string[] }>;
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
  abuseScore: number | null;
  isKnownMalicious: boolean;
  suspiciousReports: number;
}

// --- Risk Breakdown ---
export interface RiskBreakdown {
  localHeuristicRisk: number;
  urlStructuralRisk: number;
  domainCharacteristicRisk: number;
  pathQueryRisk: number;
  threatIntelligenceRisk: number;
  totalRisk: number;
}

export type TargetClassification = "url" | "domain" | "ip";

export interface AnalysisCoverage {
  totalRelevant: number;
  responded: number;
  threats: number;
  clean: number;
  errors: number;
  timeouts: number;
  unavailable: number;
  unknown: number;
  percentage: number;
}

export type ProviderStatus =
  | "threat"
  | "clean"
  | "error"
  | "timeout"
  | "unavailable"
  | "unknown";

export interface NormalizedProviderResult {
  provider: string;
  status: ProviderStatus;
  evidence: string[];
  scoreContribution: number;
  error?: string;
  relevance?: "exact" | "domain" | "related" | "historical";
  details?: Record<string, unknown>;
}

// --- Full URL Analysis Result ---
export interface URLAnalysisResult {
  url: string;
  verdict: Verdict;
  riskScore: number;
  threatLevel: ThreatLevel;
  severity: "info" | "low" | "medium" | "high" | "critical";
  sources: string[];
  riskFactors: RiskFactor[];
  structural: StructuralAnalysis;
  urlCharacteristics: URLCharacteristics;
  domainCharacteristics: DomainCharacteristics;
  threatIntelligence: ThreatIntelligence;
  riskBreakdown: RiskBreakdown;
  findings: Finding[];
  timestamp?: string;
  targetType?: TargetClassification;
  coverage?: AnalysisCoverage;
  providerResults?: Record<string, NormalizedProviderResult>;
}

// --- API Response Wrapper ---
export interface APISuccessResponse {
  success: true;
  data: URLAnalysisResult;
}

export interface APIErrorResponse {
  error: string;
  retryAfterMs?: number;
}

export type APIResponse = APISuccessResponse | APIErrorResponse;

// --- Extension UI State ---
export type AnalysisState = "idle" | "loading" | "success" | "error";

// --- Cached Analysis ---
export interface CachedAnalysis {
  url: string;
  result: URLAnalysisResult;
  timestamp: number;
}
