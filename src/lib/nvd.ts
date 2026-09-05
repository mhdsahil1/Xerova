// ============================================================
// XEROVA — National Vulnerability Database (NVD) 2.0 Client
// Implements:
// 1. CVE API 2.0 (https://services.nvd.nist.gov/rest/json/cves/2.0)
// 2. CVE Change History API 2.0 (https://services.nvd.nist.gov/rest/json/cvehistory/2.0)
// Authenticated with NVD_API_KEY via apiKey header (50 req / 30s)
// ============================================================

export function scoreToSeverity(score: number): "critical" | "high" | "medium" | "low" | "info" {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  if (score > 0) return "low";
  return "info";
}

const NVD_CVES_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const NVD_HISTORY_BASE = "https://services.nvd.nist.gov/rest/json/cvehistory/2.0";

// In-memory cache to respect NVD guidelines and optimize latency
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number): void {
  // Prevent unbounded memory growth
  if (cache.size > 1000) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function getNvdApiKey(): string {
  return process.env.NVD_API_KEY || "";
}

/**
 * Builds standard NVD headers including apiKey if configured
 */
function buildNvdHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "XEROVA-Vulnerability-Intelligence/1.0 (Cybersecurity Analysis Platform)",
  };

  const key = getNvdApiKey();
  if (key) {
    headers["apiKey"] = key;
  }

  return headers;
}

/**
 * Safe fetch wrapper with timeout
 */
async function nvdFetch(url: string, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: buildNvdHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// Types
// ============================================================

export interface CVSSMetricBreakdown {
  version: string;
  vectorString: string;
  baseScore: number;
  baseSeverity: string;
  attackVector?: string;
  attackComplexity?: string;
  privilegesRequired?: string;
  userInteraction?: string;
  scope?: string;
  confidentialityImpact?: string;
  integrityImpact?: string;
  availabilityImpact?: string;
  exploitabilityScore?: number;
  impactScore?: number;
}

export interface CVEChangeDetail {
  action: string; // "Added" | "Modified" | "Removed"
  type: string;   // "Description" | "Reference" | "CWE" | "CVSS V3.1" | etc.
  oldValue?: string;
  newValue?: string;
}

export interface CVEChangeEvent {
  cveId: string;
  eventName: string;
  cveChangeId: string;
  sourceIdentifier: string;
  created: string;
  details: CVEChangeDetail[];
}

export interface AffectedSoftware {
  vendor: string;
  product: string;
  versions: string[];
}

export interface CVEReferenceItem {
  url: string;
  source: string;
  tags: string[];
}

export interface DetailedCVE {
  id: string;
  title: string;
  description: string;
  published: string;
  lastModified: string;
  vulnStatus: string;
  sourceIdentifier: string;
  cvssScore: number;
  cvssVector: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  metrics: CVSSMetricBreakdown | null;
  weaknesses: string[];
  affectedProducts: AffectedSoftware[];
  references: CVEReferenceItem[];
  exploitAvailable: boolean;
  patchAvailable: boolean;
  history?: CVEChangeEvent[];
}

// ============================================================
// 1. Single CVE Lookup API
// ============================================================

/**
 * Normalizes raw NVD CVE JSON into standard DetailedCVE object
 */
export function parseNvdCve(rawCve: Record<string, unknown>): DetailedCVE {
  const cveId = (rawCve.id as string) || "";
  const sourceIdentifier = (rawCve.sourceIdentifier as string) || "";
  const published = rawCve.published
    ? new Date(rawCve.published as string).toISOString()
    : "";
  const lastModified = rawCve.lastModified
    ? new Date(rawCve.lastModified as string).toISOString()
    : "";
  const vulnStatus = (rawCve.vulnStatus as string) || "";

  // English description preferred
  const descriptions = (rawCve.descriptions as Array<{ lang: string; value: string }>) || [];
  const description =
    descriptions.find((d) => d.lang === "en")?.value ||
    descriptions[0]?.value ||
    "No description provided.";

  // CVSS Metrics Extraction
  const metricsContainer = (rawCve.metrics as Record<string, unknown[]>) || {};
  const v31Metric = metricsContainer.cvssMetricV31?.[0] as Record<string, unknown> | undefined;
  const v30Metric = metricsContainer.cvssMetricV30?.[0] as Record<string, unknown> | undefined;
  const v40Metric = metricsContainer.cvssMetricV40?.[0] as Record<string, unknown> | undefined;
  const v2Metric = metricsContainer.cvssMetricV2?.[0] as Record<string, unknown> | undefined;

  let metrics: CVSSMetricBreakdown | null = null;
  let cvssScore = 0;
  let cvssVector = "";
  let baseSeverityStr = "info";

  if (v31Metric?.cvssData) {
    const cvss = v31Metric.cvssData as Record<string, unknown>;
    cvssScore = Number(cvss.baseScore) || 0;
    cvssVector = String(cvss.vectorString || "");
    baseSeverityStr = String(cvss.baseSeverity || v31Metric.baseSeverity || "").toLowerCase();
    metrics = {
      version: "3.1",
      vectorString: cvssVector,
      baseScore: cvssScore,
      baseSeverity: baseSeverityStr,
      attackVector: cvss.attackVector as string,
      attackComplexity: cvss.attackComplexity as string,
      privilegesRequired: cvss.privilegesRequired as string,
      userInteraction: cvss.userInteraction as string,
      scope: cvss.scope as string,
      confidentialityImpact: cvss.confidentialityImpact as string,
      integrityImpact: cvss.integrityImpact as string,
      availabilityImpact: cvss.availabilityImpact as string,
      exploitabilityScore: Number(v31Metric.exploitabilityScore) || undefined,
      impactScore: Number(v31Metric.impactScore) || undefined,
    };
  } else if (v30Metric?.cvssData) {
    const cvss = v30Metric.cvssData as Record<string, unknown>;
    cvssScore = Number(cvss.baseScore) || 0;
    cvssVector = String(cvss.vectorString || "");
    baseSeverityStr = String(cvss.baseSeverity || v30Metric.baseSeverity || "").toLowerCase();
    metrics = {
      version: "3.0",
      vectorString: cvssVector,
      baseScore: cvssScore,
      baseSeverity: baseSeverityStr,
      attackVector: cvss.attackVector as string,
      attackComplexity: cvss.attackComplexity as string,
      privilegesRequired: cvss.privilegesRequired as string,
      userInteraction: cvss.userInteraction as string,
      scope: cvss.scope as string,
      confidentialityImpact: cvss.confidentialityImpact as string,
      integrityImpact: cvss.integrityImpact as string,
      availabilityImpact: cvss.availabilityImpact as string,
      exploitabilityScore: Number(v30Metric.exploitabilityScore) || undefined,
      impactScore: Number(v30Metric.impactScore) || undefined,
    };
  } else if (v40Metric?.cvssData) {
    const cvss = v40Metric.cvssData as Record<string, unknown>;
    cvssScore = Number(cvss.baseScore) || 0;
    cvssVector = String(cvss.vectorString || "");
    baseSeverityStr = String(cvss.baseSeverity || "").toLowerCase();
    metrics = {
      version: "4.0",
      vectorString: cvssVector,
      baseScore: cvssScore,
      baseSeverity: baseSeverityStr,
      attackVector: cvss.attackVector as string,
      attackComplexity: cvss.attackComplexity as string,
      privilegesRequired: cvss.privilegesRequired as string,
      userInteraction: cvss.userInteraction as string,
    };
  } else if (v2Metric?.cvssData) {
    const cvss = v2Metric.cvssData as Record<string, unknown>;
    cvssScore = Number(cvss.baseScore) || 0;
    cvssVector = String(cvss.vectorString || "");
    baseSeverityStr = String(v2Metric.baseSeverity || "").toLowerCase();
    metrics = {
      version: "2.0",
      vectorString: cvssVector,
      baseScore: cvssScore,
      baseSeverity: baseSeverityStr,
      exploitabilityScore: Number(v2Metric.exploitabilityScore) || undefined,
      impactScore: Number(v2Metric.impactScore) || undefined,
    };
  }

  // Parse CWE Weaknesses
  const weaknesses: string[] = [];
  const rawWeaknesses = (rawCve.weaknesses as Array<{ description?: Array<{ lang: string; value: string }> }>) || [];
  for (const w of rawWeaknesses) {
    for (const d of w.description || []) {
      if (d.value && d.value !== "NVD-CWE-noinfo" && !weaknesses.includes(d.value)) {
        weaknesses.push(d.value);
      }
    }
  }

  // Parse Affected Products (CPE configurations)
  const affectedProducts: AffectedSoftware[] = [];
  const configurations = (rawCve.configurations as Array<{ nodes?: Array<{ cpeMatch?: Array<{ criteria: string }> }> }>) || [];
  for (const config of configurations) {
    for (const node of config.nodes || []) {
      for (const match of node.cpeMatch || []) {
        const criteria = match.criteria || "";
        const parts = criteria.split(":");
        if (parts.length >= 5) {
          const vendor = parts[3] || "generic";
          const product = parts[4] || "generic";
          const version = parts[5] && parts[5] !== "*" && parts[5] !== "-" ? parts[5] : "all versions";
          const existing = affectedProducts.find((p) => p.vendor === vendor && p.product === product);
          if (existing) {
            if (!existing.versions.includes(version)) existing.versions.push(version);
          } else {
            affectedProducts.push({ vendor, product, versions: [version] });
          }
        }
      }
    }
  }

  // Parse References
  const rawRefs = (rawCve.references as Array<{ url?: string; source?: string; tags?: string[] }>) || [];
  const references: CVEReferenceItem[] = rawRefs.map((r) => ({
    url: r.url || "",
    source: r.source || "NVD",
    tags: r.tags || [],
  }));

  const patchAvailable = references.some((r) =>
    r.tags.some((t) => ["Patch", "Mitigation", "Vendor Advisory"].includes(t))
  );
  const exploitAvailable =
    (metrics?.exploitabilityScore && metrics.exploitabilityScore > 3.0) ||
    references.some((r) => r.tags.some((t) => ["Exploit", "Technical Description"].includes(t)));

  // Title generation: clean summary under 100 characters
  const cleanTitle =
    description.length > 95
      ? `${description.slice(0, 95).trim()}...`
      : description;

  return {
    id: cveId,
    title: cleanTitle,
    description,
    published,
    lastModified,
    vulnStatus,
    sourceIdentifier,
    cvssScore,
    cvssVector,
    severity: scoreToSeverity(cvssScore * 10),
    metrics,
    weaknesses,
    affectedProducts: affectedProducts.slice(0, 20), // Top 20 for UI cleanliness
    references: references.slice(0, 30),
    exploitAvailable,
    patchAvailable,
  };
}

/**
 * Fetch a single CVE from NVD with caching (2 hours TTL)
 */
export async function getNVD_CVE(cveId: string, includeHistory = false): Promise<DetailedCVE | null> {
  const cleanId = cveId.trim().toUpperCase();
  const cacheKey = `nvd:cve:${cleanId}:${includeHistory}`;
  const cached = getCached<DetailedCVE>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${NVD_CVES_BASE}?cveId=${encodeURIComponent(cleanId)}`;
    const res = await nvdFetch(url);

    if (!res.ok) {
      if (res.status === 404) return null;
      console.warn(`[NVD] CVE fetch returned status ${res.status} for ${cleanId}`);
      return null;
    }

    const json = await res.json();
    const rawCve = json?.vulnerabilities?.[0]?.cve;
    if (!rawCve) return null;

    const result = parseNvdCve(rawCve);

    if (includeHistory) {
      const history = await getNVD_CVEHistory(cleanId);
      result.history = history;
    }

    setCache(cacheKey, result, 2 * 60 * 60 * 1000); // 2 hours TTL
    return result;
  } catch (error) {
    console.error(`[NVD] Failed looking up CVE ${cleanId}:`, (error as Error).message);
    return null;
  }
}

// ============================================================
// 2. CVE Change History API 2.0
// ============================================================

/**
 * Retrieves the full change history for a CVE from NVD Change History API 2.0
 * Uses the cveIds parameter (cveId is deprecated by NIST).
 */
export async function getNVD_CVEHistory(
  cveId: string,
  options?: { eventName?: string; startIndex?: number; resultsPerPage?: number }
): Promise<CVEChangeEvent[]> {
  const cleanId = cveId.trim().toUpperCase();
  const cacheKey = `nvd:history:${cleanId}:${options?.eventName || "all"}:${options?.startIndex || 0}`;
  const cached = getCached<CVEChangeEvent[]>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams();
    params.set("cveIds", cleanId);
    if (options?.eventName) params.set("eventName", options.eventName);
    if (options?.startIndex !== undefined) params.set("startIndex", String(options.startIndex));
    if (options?.resultsPerPage !== undefined) {
      params.set("resultsPerPage", String(options.resultsPerPage));
    } else {
      params.set("resultsPerPage", "50");
    }

    const url = `${NVD_HISTORY_BASE}?${params.toString()}`;
    const res = await nvdFetch(url);

    if (!res.ok) {
      console.warn(`[NVD History] Returned status ${res.status} for ${cleanId}`);
      return [];
    }

    const json = await res.json();
    const rawChanges = (json?.cveChanges as Array<{ change: Record<string, unknown> }>) || [];

    const events: CVEChangeEvent[] = rawChanges.map((item) => {
      const c = item.change || {};
      const rawDetails = (c.details as Array<Record<string, string>>) || [];

      return {
        cveId: (c.cveId as string) || cleanId,
        eventName: (c.eventName as string) || "CVE Modified",
        cveChangeId: (c.cveChangeId as string) || "",
        sourceIdentifier: (c.sourceIdentifier as string) || "nvd@nist.gov",
        created: c.created ? new Date(c.created as string).toISOString() : new Date().toISOString(),
        details: rawDetails.map((d) => ({
          action: d.action || "Modified",
          type: d.type || "Attribute",
          oldValue: d.oldValue,
          newValue: d.newValue,
        })),
      };
    });

    // Sort descending by created timestamp so newest changes appear first
    events.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    setCache(cacheKey, events, 60 * 60 * 1000); // 1 hour TTL
    return events;
  } catch (error) {
    console.error(`[NVD History] Failed retrieving history for ${cleanId}:`, (error as Error).message);
    return [];
  }
}

// ============================================================
// 3. Search & Feed Collection API
// ============================================================

export interface NVDSearchParams {
  keyword?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "ALL";
  daysBack?: number; // Filter by recent publication window (e.g. 30, 60, 120 days)
  startIndex?: number;
  resultsPerPage?: number;
}

export interface NVDSearchResult {
  totalResults: number;
  startIndex: number;
  resultsPerPage: number;
  vulnerabilities: DetailedCVE[];
}

/**
 * Searches CVEs or retrieves recent feeds with keyword, severity, and date range filters
 */
export async function searchNVD_CVEs(params: NVDSearchParams): Promise<NVDSearchResult> {
  const {
    keyword,
    severity,
    daysBack = 60,
    startIndex = 0,
    resultsPerPage = 12,
  } = params;

  const cacheKey = `nvd:search:${keyword || ""}:${severity || ""}:${daysBack}:${startIndex}:${resultsPerPage}`;
  const cached = getCached<NVDSearchResult>(cacheKey);
  if (cached) return cached;

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("startIndex", String(startIndex));
    searchParams.set("resultsPerPage", String(Math.min(50, resultsPerPage)));

    if (keyword && keyword.trim()) {
      searchParams.set("keywordSearch", keyword.trim());
    }

    if (severity && severity !== "ALL") {
      searchParams.set("cvssV3Severity", severity);
    }

    // Only apply date range if not doing a specific keyword search, or if explicitly requested
    // (NVD API limits date range to max 120 consecutive days)
    if (daysBack > 0 && !keyword) {
      const now = new Date();
      const past = new Date(Date.now() - Math.min(120, daysBack) * 24 * 60 * 60 * 1000);
      searchParams.set("pubStartDate", past.toISOString());
      searchParams.set("pubEndDate", now.toISOString());
    }

    const url = `${NVD_CVES_BASE}?${searchParams.toString()}`;
    const res = await nvdFetch(url);

    if (!res.ok) {
      console.warn(`[NVD Search] Query failed with status ${res.status}`);
      return { totalResults: 0, startIndex, resultsPerPage, vulnerabilities: [] };
    }

    const json = await res.json();
    const totalResults = Number(json.totalResults) || 0;
    const rawVulns = (json.vulnerabilities as Array<{ cve: Record<string, unknown> }>) || [];

    const vulnerabilities = rawVulns.map((v) => parseNvdCve(v.cve));

    // Sort newest first
    vulnerabilities.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

    const result: NVDSearchResult = {
      totalResults,
      startIndex,
      resultsPerPage,
      vulnerabilities,
    };

    setCache(cacheKey, result, 15 * 60 * 1000); // 15 minutes TTL
    return result;
  } catch (error) {
    console.error("[NVD Search] Error searching CVEs:", (error as Error).message);
    return { totalResults: 0, startIndex, resultsPerPage, vulnerabilities: [] };
  }
}
