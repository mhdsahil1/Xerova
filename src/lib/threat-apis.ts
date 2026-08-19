// ============================================
// XEROVA — Centralized Threat Intelligence API Client
// ============================================
// Handles VirusTotal, AbuseIPDB, Shodan, NVD, Criminal IP, and Abusix.
// Features: caching, timeouts, parallel requests, graceful degradation.

import { scoreToSeverity } from "./sanitize";

// ---- In-Memory Cache ----
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60_000; // 5 minutes for lookups
const CVE_CACHE_TTL = 60 * 60_000; // 1 hour for CVE feed
const FETCH_TIMEOUT = 12_000; // 12 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttl = CACHE_TTL) {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ---- Safe Fetch with Timeout ----
async function safeFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// VirusTotal
// ============================================================
const VT_BASE = "https://www.virustotal.com/api/v3";
const VT_KEY = process.env.VIRUSTOTAL_API_KEY || "";

function vtHeaders() {
  return { "x-apikey": VT_KEY, Accept: "application/json" };
}

export async function vtLookupIP(ip: string) {
  const cacheKey = `vt:ip:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${VT_BASE}/ip_addresses/${ip}`, {
      headers: vtHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const attrs = json?.data?.attributes || {};
    const result = {
      reputation: attrs.reputation ?? 0,
      country: attrs.country ?? "",
      asOwner: attrs.as_owner ?? "",
      asn: attrs.asn ? `AS${attrs.asn}` : "",
      network: attrs.network ?? "",
      lastAnalysisStats: attrs.last_analysis_stats ?? {},
      totalVotes: attrs.total_votes ?? {},
      whois: attrs.whois ?? "",
      lastAnalysisDate: attrs.last_analysis_date
        ? new Date(attrs.last_analysis_date * 1000).toISOString()
        : null,
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[VT] IP lookup failed:", (e as Error).message);
    return null;
  }
}

export async function vtLookupDomain(domain: string) {
  const cacheKey = `vt:domain:${domain}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${VT_BASE}/domains/${domain}`, {
      headers: vtHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const attrs = json?.data?.attributes || {};
    const result = {
      reputation: attrs.reputation ?? 0,
      registrar: attrs.registrar ?? "",
      creationDate: attrs.creation_date
        ? new Date(attrs.creation_date * 1000).toISOString().slice(0, 10)
        : "",
      lastUpdateDate: attrs.last_update_date
        ? new Date(attrs.last_update_date * 1000).toISOString().slice(0, 10)
        : "",
      lastDnsRecords: attrs.last_dns_records ?? [],
      lastHttpsCertificate: attrs.last_https_certificate ?? null,
      categories: attrs.categories ?? {},
      popularity: attrs.popularity_ranks ?? {},
      lastAnalysisStats: attrs.last_analysis_stats ?? {},
      totalVotes: attrs.total_votes ?? {},
      whois: attrs.whois ?? "",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[VT] Domain lookup failed:", (e as Error).message);
    return null;
  }
}

export async function vtLookupURL(url: string) {
  const cacheKey = `vt:url:${url}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    // URL ID is base64url of the URL
    const urlId = Buffer.from(url).toString("base64url");
    const res = await safeFetch(`${VT_BASE}/urls/${urlId}`, {
      headers: vtHeaders(),
    });
    if (res.status === 404) {
      // Submit URL for scanning
      const scanRes = await safeFetch(`${VT_BASE}/urls`, {
        method: "POST",
        headers: { ...vtHeaders(), "Content-Type": "application/x-www-form-urlencoded" },
        body: `url=${encodeURIComponent(url)}`,
      });
      if (!scanRes.ok) return null;
      // Re-fetch after a short delay
      await new Promise((r) => setTimeout(r, 3000));
      const retryRes = await safeFetch(`${VT_BASE}/urls/${urlId}`, {
        headers: vtHeaders(),
      });
      if (!retryRes.ok) return { status: "queued", message: "URL submitted for analysis. Results may take a minute." };
      const retryJson = await retryRes.json();
      const attrs = retryJson?.data?.attributes || {};
      const result = buildUrlResult(attrs);
      setCache(cacheKey, result);
      return result;
    }
    if (!res.ok) return null;
    const json = await res.json();
    const attrs = json?.data?.attributes || {};
    const result = buildUrlResult(attrs);
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[VT] URL lookup failed:", (e as Error).message);
    return null;
  }
}

function buildUrlResult(attrs: Record<string, unknown>) {
  return {
    url: attrs.url ?? "",
    finalUrl: attrs.last_final_url ?? attrs.url ?? "",
    lastAnalysisStats: attrs.last_analysis_stats ?? {},
    categories: attrs.categories ?? {},
    title: attrs.title ?? "",
    totalVotes: attrs.total_votes ?? {},
    reputation: attrs.reputation ?? 0,
    lastAnalysisDate: attrs.last_analysis_date
      ? new Date((attrs.last_analysis_date as number) * 1000).toISOString()
      : null,
    redirectionChain: attrs.redirection_chain ?? [],
    trackers: attrs.trackers ?? {},
  };
}

export async function vtLookupHash(hash: string) {
  const cacheKey = `vt:hash:${hash}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${VT_BASE}/files/${hash}`, {
      headers: vtHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const attrs = json?.data?.attributes || {};
    const result = {
      meaningfulName: attrs.meaningful_name ?? attrs.names?.[0] ?? "",
      fileType: attrs.type_description ?? attrs.type_tag ?? "",
      fileSize: attrs.size ?? 0,
      md5: attrs.md5 ?? "",
      sha1: attrs.sha1 ?? "",
      sha256: attrs.sha256 ?? "",
      lastAnalysisStats: attrs.last_analysis_stats ?? {},
      lastAnalysisResults: attrs.last_analysis_results ?? {},
      tags: attrs.tags ?? [],
      firstSubmissionDate: attrs.first_submission_date
        ? new Date(attrs.first_submission_date * 1000).toISOString().slice(0, 10)
        : "",
      lastAnalysisDate: attrs.last_analysis_date
        ? new Date(attrs.last_analysis_date * 1000).toISOString().slice(0, 10)
        : "",
      sandboxVerdicts: attrs.sandbox_verdicts ?? {},
      reputation: attrs.reputation ?? 0,
      totalVotes: attrs.total_votes ?? {},
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[VT] Hash lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// AbuseIPDB
// ============================================================
const ABUSE_BASE = "https://api.abuseipdb.com/api/v2";
const ABUSE_KEY = process.env.ABUSEIPDB_API_KEY || "";

export async function abuseIPDBLookup(ip: string) {
  const cacheKey = `abuse:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${ABUSE_BASE}/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose=true`,
      { headers: { Key: ABUSE_KEY, Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data || {};
    const result = {
      abuseConfidenceScore: d.abuseConfidenceScore ?? 0,
      countryCode: d.countryCode ?? "",
      countryName: d.countryName ?? "",
      isp: d.isp ?? "",
      domain: d.domain ?? "",
      usageType: d.usageType ?? "",
      hostnames: d.hostnames ?? [],
      totalReports: d.totalReports ?? 0,
      numDistinctUsers: d.numDistinctUsers ?? 0,
      lastReportedAt: d.lastReportedAt ?? null,
      isWhitelisted: d.isWhitelisted ?? false,
      isTor: d.isTor ?? false,
      isPublic: d.isPublic ?? true,
      reports: (d.reports ?? []).slice(0, 5).map((r: Record<string, unknown>) => ({
        reportedAt: r.reportedAt,
        comment: r.comment ?? "",
        categories: r.categories ?? [],
        reporterCountryCode: r.reporterCountryCode ?? "",
      })),
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[AbuseIPDB] Lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// Shodan
// ============================================================
const SHODAN_BASE = "https://api.shodan.io";
const SHODAN_KEY = process.env.SHODAN_API_KEY || "";

export async function shodanLookupIP(ip: string) {
  const cacheKey = `shodan:ip:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${SHODAN_BASE}/shodan/host/${ip}?key=${SHODAN_KEY}&minify=true`
    );
    if (!res.ok) return null;
    const d = await res.json();
    const result = {
      ip: d.ip_str ?? ip,
      ports: d.ports ?? [],
      hostnames: d.hostnames ?? [],
      org: d.org ?? "",
      isp: d.isp ?? "",
      os: d.os ?? null,
      city: d.city ?? "",
      country: d.country_name ?? "",
      countryCode: d.country_code ?? "",
      lastUpdate: d.last_update ?? "",
      vulns: d.vulns ?? [],
      tags: d.tags ?? [],
      asn: d.asn ?? "",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[Shodan] IP lookup failed:", (e as Error).message);
    return null;
  }
}

export async function shodanResolveDomain(domain: string) {
  const cacheKey = `shodan:resolve:${domain}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${SHODAN_BASE}/dns/resolve?hostnames=${domain}&key=${SHODAN_KEY}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const ip = json?.[domain];
    if (!ip) return null;
    const result = { resolvedIP: ip };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[Shodan] DNS resolve failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// Criminal IP
// ============================================================
const CIP_BASE = "https://api.criminalip.io/v1";
const CIP_KEY = process.env.CRIMINAL_IP_API_KEY || "";

function cipHeaders() {
  return { "x-api-key": CIP_KEY, Accept: "application/json" };
}

export async function criminalIPLookupIP(ip: string) {
  if (!CIP_KEY) return null;
  const cacheKey = `cip:ip:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${CIP_BASE}/asset/ip/report?ip=${encodeURIComponent(ip)}`,
      { headers: cipHeaders() },
      15_000
    );
    if (!res.ok) return null;
    const json = await res.json();

    const result = {
      score: json.score ?? null,
      inboundScore: json.score?.inbound ?? null,
      outboundScore: json.score?.outbound ?? null,
      isVPN: json.is_vpn ?? false,
      isProxy: json.is_proxy ?? false,
      isTor: json.is_tor ?? false,
      isHosting: json.is_hosting ?? false,
      isScanner: json.is_scanner ?? false,
      isMobile: json.is_mobile ?? false,
      isDarkweb: json.is_darkweb ?? false,
      country: json.country ?? "",
      countryCode: json.country_code ?? "",
      city: json.city ?? "",
      isp: json.isp ?? "",
      org: json.org ?? "",
      asName: json.as_name ?? "",
      openPorts: (json.port?.data ?? []).slice(0, 20).map((p: Record<string, unknown>) => ({
        port: p.open_port_no ?? 0,
        protocol: p.protocol ?? "",
        service: p.app_name ?? "",
        banner: (p.banner as string)?.slice(0, 200) ?? "",
      })),
      vulnerabilities: json.vulnerability?.count ?? 0,
      maliciousCount: json.ids?.count ?? 0,
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[CriminalIP] IP lookup failed:", (e as Error).message);
    return null;
  }
}

export async function criminalIPScanDomain(domain: string) {
  if (!CIP_KEY) return null;
  const cacheKey = `cip:domain:${domain}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    // Initiate a lite scan
    const scanRes = await safeFetch(
      `${CIP_BASE}/domain/lite/scan?query=${encodeURIComponent(domain)}`,
      { headers: cipHeaders() },
      15_000
    );
    if (!scanRes.ok) return null;
    const scanJson = await scanRes.json();
    const scanId = scanJson?.data?.scan_id;
    if (!scanId) return null;

    // Wait briefly then fetch report
    await new Promise((r) => setTimeout(r, 3000));

    const reportRes = await safeFetch(
      `${CIP_BASE}/domain/report/${scanId}`,
      { headers: cipHeaders() },
      15_000
    );
    if (!reportRes.ok) return null;
    const reportJson = await reportRes.json();
    const d = reportJson?.data ?? reportJson;

    const result = {
      scanId,
      riskScore: d.main_domain_info?.score ?? null,
      phishingScore: d.phishing_score ?? null,
      malwareScore: d.malware_score ?? null,
      title: d.main_domain_info?.title ?? "",
      ip: d.main_domain_info?.ip ?? "",
      country: d.main_domain_info?.country ?? "",
      certIssuer: d.certificate?.issuer_organization ?? "",
      certValidTo: d.certificate?.valid_to ?? "",
      technologies: (d.technologies ?? []).slice(0, 10),
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[CriminalIP] Domain scan failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// Abusix Threat Intelligence
// ============================================================
const ABUSIX_BASE = "https://threat-intel-api.abusix.com/beta";
const ABUSIX_KEY = process.env.ABUSIX_API_KEY || "";

export async function abusixLookupIP(ip: string) {
  if (!ABUSIX_KEY) return null;
  const cacheKey = `abusix:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${ABUSIX_BASE}/query/${encodeURIComponent(ip)}`,
      { headers: { "x-api-key": ABUSIX_KEY, Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const json = await res.json();

    const result = {
      listed: json.listed ?? false,
      threatLevel: json.threat_level ?? json.level ?? "unknown",
      categories: json.categories ?? [],
      firstSeen: json.first_seen ?? null,
      lastSeen: json.last_seen ?? null,
      mailBlocked: json.mail?.blocked ?? false,
      exploitBlocked: json.exploit?.blocked ?? false,
      policyBlocked: json.policy?.blocked ?? false,
      details: json.details ?? json.description ?? "",
      source: "Abusix",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[Abusix] Lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// AlienVault OTX (Open Threat Exchange)
// ============================================================
const OTX_BASE = "https://otx.alienvault.com/api/v1";
const OTX_KEY = process.env.OTX_API_KEY || "";

function otxHeaders() {
  return {
    "X-OTX-API-KEY": OTX_KEY,
    Accept: "application/json",
  };
}

export async function otxLookupIP(ip: string) {
  if (!OTX_KEY) return null;
  const cacheKey = `otx:ip:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${OTX_BASE}/indicators/IPv4/${encodeURIComponent(ip)}/general`, {
      headers: otxHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const pulseInfo = json.pulse_info || {};
    const pulses = (pulseInfo.pulses || []).slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      author: p.author_name || "",
      tags: (p.tags as string[]) || [],
      malwareFamilies: (p.malware_families as string[]) || [],
      adversary: p.adversary || "",
      references: (p.references as string[]) || [],
      created: p.created || "",
    }));

    const result = {
      pulseCount: pulseInfo.count ?? 0,
      pulses,
      reputation: json.reputation ?? 0,
      country: json.country_name ?? "",
      city: json.city ?? "",
      asn: json.asn ?? "",
      validation: (json.validation || []).map((v: Record<string, string>) => ({
        source: v.source || "",
        message: v.message || "",
        name: v.name || "",
      })),
      source: "AlienVault OTX",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[OTX] IP lookup failed:", (e as Error).message);
    return null;
  }
}

export async function otxLookupDomain(domain: string) {
  if (!OTX_KEY) return null;
  const cacheKey = `otx:domain:${domain}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${OTX_BASE}/indicators/domain/${encodeURIComponent(domain)}/general`, {
      headers: otxHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const pulseInfo = json.pulse_info || {};
    const pulses = (pulseInfo.pulses || []).slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      author: p.author_name || "",
      tags: (p.tags as string[]) || [],
      malwareFamilies: (p.malware_families as string[]) || [],
      adversary: p.adversary || "",
      references: (p.references as string[]) || [],
      created: p.created || "",
    }));

    const result = {
      pulseCount: pulseInfo.count ?? 0,
      pulses,
      alexa: json.alexa || "",
      validation: (json.validation || []).map((v: Record<string, string>) => ({
        source: v.source || "",
        message: v.message || "",
        name: v.name || "",
      })),
      source: "AlienVault OTX",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[OTX] Domain lookup failed:", (e as Error).message);
    return null;
  }
}

export async function otxLookupURL(url: string) {
  if (!OTX_KEY) return null;
  const cacheKey = `otx:url:${url}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${OTX_BASE}/indicators/url/${encodeURIComponent(url)}/general`, {
      headers: otxHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const pulseInfo = json.pulse_info || {};
    const pulses = (pulseInfo.pulses || []).slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      author: p.author_name || "",
      tags: (p.tags as string[]) || [],
      created: p.created || "",
    }));

    const result = {
      pulseCount: pulseInfo.count ?? 0,
      pulses,
      alexa: json.alexa || "",
      source: "AlienVault OTX",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[OTX] URL lookup failed:", (e as Error).message);
    return null;
  }
}

export async function otxLookupHash(hash: string) {
  if (!OTX_KEY) return null;
  const cacheKey = `otx:hash:${hash}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${OTX_BASE}/indicators/file/${encodeURIComponent(hash)}/general`, {
      headers: otxHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const pulseInfo = json.pulse_info || {};
    const pulses = (pulseInfo.pulses || []).slice(0, 10).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      author: p.author_name || "",
      tags: (p.tags as string[]) || [],
      malwareFamilies: (p.malware_families as string[]) || [],
      adversary: p.adversary || "",
      references: (p.references as string[]) || [],
      created: p.created || "",
    }));

    const result = {
      pulseCount: pulseInfo.count ?? 0,
      pulses,
      adversary: json.adversary || "",
      malwareFamilies: json.malware_families || [],
      source: "AlienVault OTX",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[OTX] Hash lookup failed:", (e as Error).message);
    return null;
  }
}

export async function otxGetLivePulses(limit = 8) {
  if (!OTX_KEY) return [];
  const cacheKey = `otx:live_pulses:${limit}`;
  const cached = getCached<Record<string, unknown>[]>(cacheKey);
  if (cached) return cached;

  try {
    let res = await safeFetch(`${OTX_BASE}/pulses/subscribed?limit=${limit}`, {
      headers: otxHeaders(),
    });
    if (!res.ok) {
      res = await safeFetch(`${OTX_BASE}/pulses/activity?limit=${limit}`, {
        headers: otxHeaders(),
      });
    }
    if (!res.ok) return [];
    const json = await res.json();
    const results = (json.results || []).slice(0, limit).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name || "Emerging Threat Campaign",
      description: p.description || "",
      author: p.author_name || "AlienVault OTX",
      tags: ((p.tags as string[]) || []).slice(0, 6),
      adversary: p.adversary || null,
      targetedCountries: ((p.targeted_countries as string[]) || []).slice(0, 5),
      malwareFamilies: ((p.malware_families as string[]) || []).slice(0, 5),
      indicatorCount: p.indicator_count || (p.indicators as unknown[])?.length || 0,
      created: p.created ? new Date(p.created as string).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      references: ((p.references as string[]) || []).slice(0, 3),
    }));
    setCache(cacheKey, results, 15 * 60_000);
    return results;
  } catch (e) {
    console.error("[OTX] Live pulses fetch failed:", (e as Error).message);
    return [];
  }
}

// ============================================================
// alphaMountain.ai / ThreatYeti
// ============================================================
const ALPHA_BASE = "https://api.alphamountain.ai";
const ALPHA_KEY = process.env.ALPHA_MOUNTAIN_API || process.env.THREATYETI_API_KEY || "";

export async function alphaMountainLookupURI(uri: string) {
  if (!ALPHA_KEY) return null;
  const cacheKey = `alpha:${uri}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const [threatRes, catRes] = await Promise.all([
      safeFetch(`${ALPHA_BASE}/threat/uri/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ license: ALPHA_KEY, uri, version: "1.0" }),
      }),
      safeFetch(`${ALPHA_BASE}/category/uri/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ license: ALPHA_KEY, uri, version: "1.0" }),
      }),
    ]);

    let threatData: Record<string, unknown> | null = null;
    let catData: Record<string, unknown> | null = null;

    if (threatRes.ok) {
      const j = await threatRes.json();
      threatData = j?.threat ?? null;
    }
    if (catRes.ok) {
      const j = await catRes.json();
      catData = j?.category ?? null;
    }

    if (!threatData && !catData) return null;

    const rawScore = typeof threatData?.score === "number" ? threatData.score : 1.0;
    const normalizedRisk = Math.min(100, Math.max(0, Math.round(((rawScore - 1.0) / 4.0) * 100)));

    const result = {
      threatScore: rawScore,
      riskScore: normalizedRisk,
      scope: (threatData?.scope as string) || "uri",
      source: (threatData?.source as string) || "alphaMountain.ai",
      categories: (catData?.categories as number[]) || [],
      confidence: typeof catData?.confidence === "number" ? catData.confidence : 0,
      severity: normalizedRisk >= 75 ? "critical" : normalizedRisk >= 50 ? "high" : normalizedRisk >= 25 ? "medium" : "low",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[alphaMountain] URI lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// URLQuery
// ============================================================
const URLQUERY_BASE = "https://api.urlquery.net/public/v1";
const URLQUERY_KEY = process.env.URL_QUERY_API_KEY || "";

export async function urlqueryLookup(query: string) {
  if (!URLQUERY_KEY) return null;
  const cacheKey = `urlquery:${query}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${URLQUERY_BASE}/search/reports/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "x-apikey": URLQUERY_KEY,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const reports = (json.reports || []).slice(0, 5).map((r: Record<string, unknown>) => ({
      id: r.id || r.report_id || "",
      url: r.url || "",
      status: r.status || "completed",
      date: r.date || r.created || "",
    }));

    const result = {
      totalHits: json.total_hits ?? 0,
      reports,
      source: "URLQuery",
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[URLQuery] Search failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// NVD (National Vulnerability Database)
// ============================================================
const NVD_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

export async function nvdLookupCVE(cveId: string) {
  const cacheKey = `nvd:${cveId}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${NVD_BASE}?cveId=${cveId}`, {}, 15_000);
    if (!res.ok) return null;
    const json = await res.json();
    const vuln = json?.vulnerabilities?.[0]?.cve;
    if (!vuln) return null;

    // Extract CVSS score — try 3.1, then 3.0, then 2.0
    const metrics =
      vuln.metrics?.cvssMetricV31?.[0] ??
      vuln.metrics?.cvssMetricV30?.[0] ??
      null;
    const cvss2 = vuln.metrics?.cvssMetricV2?.[0];

    const cvssScore = metrics?.cvssData?.baseScore ?? cvss2?.cvssData?.baseScore ?? 0;
    const cvssVector =
      metrics?.cvssData?.vectorString ?? cvss2?.cvssData?.vectorString ?? "";
    const exploitabilityScore = metrics?.exploitabilityScore ?? 0;

    const description =
      vuln.descriptions?.find((d: Record<string, string>) => d.lang === "en")?.value ?? "";

    const affectedProducts: { vendor: string; product: string; versions: string[] }[] =
      [];
    const configs = vuln.configurations ?? [];
    for (const config of configs) {
      for (const node of config.nodes ?? []) {
        for (const match of node.cpeMatch ?? []) {
          const parts = (match.criteria ?? "").split(":");
          if (parts.length >= 5) {
            const vendor = parts[3] ?? "";
            const product = parts[4] ?? "";
            const version = parts[5] ?? "*";
            const existing = affectedProducts.find(
              (p) => p.vendor === vendor && p.product === product
            );
            if (existing) {
              if (!existing.versions.includes(version)) existing.versions.push(version);
            } else {
              affectedProducts.push({ vendor, product, versions: [version] });
            }
          }
        }
      }
    }

    const references = (vuln.references ?? []).map(
      (ref: Record<string, unknown>) => ({
        url: ref.url ?? "",
        source: ref.source ?? "",
        tags: ref.tags ?? [],
      })
    );

    const cwes: string[] = [];
    for (const weakness of vuln.weaknesses ?? []) {
      for (const desc of weakness.description ?? []) {
        if (desc.lang === "en" && desc.value) cwes.push(desc.value);
      }
    }

    const result = {
      id: vuln.id ?? cveId,
      description,
      cvssScore,
      cvssVector,
      severity: scoreToSeverity(cvssScore * 10),
      publishedDate: vuln.published
        ? new Date(vuln.published).toISOString().slice(0, 10)
        : "",
      modifiedDate: vuln.lastModified
        ? new Date(vuln.lastModified).toISOString().slice(0, 10)
        : "",
      affectedProducts,
      references,
      cwe: cwes,
      exploitAvailable: exploitabilityScore > 3,
      patchAvailable: references.some(
        (r: { tags: string[] }) =>
          r.tags.includes("Patch") || r.tags.includes("Mitigation")
      ),
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[NVD] CVE lookup failed:", (e as Error).message);
    return null;
  }
}

export async function nvdLatestCVEs(limit = 8) {
  const cacheKey = "nvd:latest";
  const cached = getCached<unknown[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch recent critical/high CVEs
    const res = await safeFetch(
      `${NVD_BASE}?cvssV3Severity=CRITICAL&resultsPerPage=${limit}`,
      {},
      15_000
    );
    if (!res.ok) return [];
    const json = await res.json();
    const vulns = json?.vulnerabilities ?? [];

    const results = vulns.map(
      (v: { cve: Record<string, unknown> }) => {
        const cve = v.cve as Record<string, unknown>;
        const metrics =
          (cve.metrics as Record<string, unknown[]>)?.cvssMetricV31?.[0] ??
          (cve.metrics as Record<string, unknown[]>)?.cvssMetricV30?.[0];
        const cvss =
          (metrics as Record<string, Record<string, number>>)?.cvssData?.baseScore ?? 0;
        const desc =
          (cve.descriptions as { lang: string; value: string }[])?.find(
            (d) => d.lang === "en"
          )?.value ?? "";

        return {
          id: cve.id ?? "",
          title: desc.slice(0, 80) + (desc.length > 80 ? "..." : ""),
          severity: scoreToSeverity(cvss * 10),
          cvss,
          published: cve.published
            ? new Date(cve.published as string).toISOString().slice(0, 10)
            : "",
          description: desc,
        };
      }
    );

    setCache(cacheKey, results, CVE_CACHE_TTL);
    return results;
  } catch (e) {
    console.error("[NVD] Latest CVEs fetch failed:", (e as Error).message);
    return [];
  }
}

// ============================================================
// Merged IP Lookup (all engines in parallel)
// ============================================================
export async function mergedIPLookup(ip: string) {
  const [vt, abuse, shodan, cip, abusix, otx] = await Promise.all([
    vtLookupIP(ip),
    abuseIPDBLookup(ip),
    shodanLookupIP(ip),
    criminalIPLookupIP(ip),
    abusixLookupIP(ip),
    otxLookupIP(ip),
  ]);

  const sources: string[] = [];
  if (vt) sources.push("VirusTotal");
  if (abuse) sources.push("AbuseIPDB");
  if (shodan) sources.push("Shodan");
  if (cip) sources.push("Criminal IP");
  if (abusix) sources.push("Abusix");
  if (otx) sources.push("AlienVault OTX");

  // Merge: prefer AbuseIPDB for geo, Shodan for ports, VT for reputation
  const abuseScore = abuse?.abuseConfidenceScore ?? 0;
  const vtMalicious = (vt?.lastAnalysisStats as Record<string, number>)?.malicious ?? 0;
  const vtTotal =
    vtMalicious +
    ((vt?.lastAnalysisStats as Record<string, number>)?.undetected ?? 0) +
    ((vt?.lastAnalysisStats as Record<string, number>)?.harmless ?? 0);
  const vtScore = vtTotal > 0 ? Math.round((vtMalicious / vtTotal) * 100) : 0;

  // Criminal IP risk score (inbound is more relevant for threat assessment)
  const cipInbound = (cip?.inboundScore as Record<string, unknown>)?.score;
  const cipScore = typeof cipInbound === "number" ? cipInbound : 0;

  // Abusix listed = high risk signal
  const abusixScore = abusix?.listed ? 75 : 0;

  // OTX threat pulses
  const otxScore = (otx?.pulseCount as number) > 0 ? Math.min(100, (otx?.pulseCount as number) * 15) : 0;

  // Composite risk score — takes the maximum across all sources
  const riskScore = Math.min(
    100,
    Math.max(
      abuseScore,
      vtScore,
      shodan?.vulns?.length ? 70 : 0,
      cipScore,
      abusixScore,
      otxScore
    )
  );

  return {
    ip,
    country: abuse?.countryName || (cip?.country as string) || (otx?.country as string) || shodan?.country || vt?.country || "Unknown",
    countryCode: abuse?.countryCode || (cip?.countryCode as string) || shodan?.countryCode || "",
    city: (cip?.city as string) || (otx?.city as string) || shodan?.city || "",
    isp: abuse?.isp || (cip?.isp as string) || shodan?.isp || "",
    org: shodan?.org || (cip?.org as string) || vt?.asOwner || "",
    asn: (otx?.asn as string) || shodan?.asn || vt?.asn || "",
    hostname: (shodan?.hostnames as string[])?.[0] || (abuse?.hostnames as string[])?.[0] || "",
    reputation: riskScore,
    isVPN: (cip?.isVPN as boolean) || (abuse?.usageType as string)?.toLowerCase().includes("vpn") || false,
    isTor: (cip?.isTor as boolean) || abuse?.isTor || false,
    isProxy: (cip?.isProxy as boolean) || (abuse?.usageType as string)?.toLowerCase().includes("proxy") || false,
    isBot: (cip?.isScanner as boolean) || false,
    isHosting: (cip?.isHosting as boolean) || false,
    isDarkweb: (cip?.isDarkweb as boolean) || false,
    abuseReports: abuse?.totalReports ?? 0,
    lastReportedAt: abuse?.lastReportedAt ?? null,
    ports: (shodan?.ports as number[]) ?? [],
    cipOpenPorts: cip?.openPorts ?? [],
    os: shodan?.os ?? null,
    hostnames: [
      ...new Set([
        ...((shodan?.hostnames as string[]) ?? []),
        ...((abuse?.hostnames as string[]) ?? []),
      ]),
    ],
    threats: buildThreats(vt, abuse, shodan, cip, abusix, otx),
    whois: parseWhoisString((vt?.whois as string) || ""),
    vtAnalysisStats: vt?.lastAnalysisStats ?? null,
    criminalIP: cip ? {
      vulnerabilities: cip.vulnerabilities,
      maliciousCount: cip.maliciousCount,
      inboundScore: cip.inboundScore,
      outboundScore: cip.outboundScore,
    } : null,
    abusix: abusix ? {
      listed: abusix.listed,
      threatLevel: abusix.threatLevel,
      categories: abusix.categories,
      lastSeen: abusix.lastSeen,
    } : null,
    otx: otx ? {
      pulseCount: otx.pulseCount,
      pulses: otx.pulses,
      reputation: otx.reputation,
      validation: otx.validation,
    } : null,
    sources,
    riskScore,
    severity: scoreToSeverity(riskScore),
  };
}

function buildThreats(
  vt: Record<string, unknown> | null,
  abuse: Record<string, unknown> | null,
  shodan: Record<string, unknown> | null,
  cip?: Record<string, unknown> | null,
  abusix?: Record<string, unknown> | null,
  otx?: Record<string, unknown> | null
) {
  const threats: { source: string; description: string; date: string; severity: string }[] = [];

  const vtMalicious = (vt?.lastAnalysisStats as Record<string, number>)?.malicious ?? 0;
  if (vtMalicious > 0) {
    threats.push({
      source: "VirusTotal",
      description: `Detected as malicious by ${vtMalicious} security vendors`,
      date: (vt?.lastAnalysisDate as string)?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      severity: vtMalicious > 10 ? "critical" : vtMalicious > 3 ? "high" : "medium",
    });
  }

  const abuseScore = (abuse?.abuseConfidenceScore as number) ?? 0;
  if (abuseScore > 0) {
    threats.push({
      source: "AbuseIPDB",
      description: `Abuse confidence score: ${abuseScore}% (${abuse?.totalReports ?? 0} reports)`,
      date: (abuse?.lastReportedAt as string)?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      severity: abuseScore > 80 ? "critical" : abuseScore > 50 ? "high" : "medium",
    });
  }

  const vulns = (shodan?.vulns as string[]) ?? [];
  if (vulns.length > 0) {
    threats.push({
      source: "Shodan",
      description: `${vulns.length} known vulnerabilities found (${vulns.slice(0, 3).join(", ")}${vulns.length > 3 ? "..." : ""})`,
      date: (shodan?.lastUpdate as string)?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      severity: vulns.length > 5 ? "critical" : "high",
    });
  }

  // Criminal IP threat signals
  if (cip) {
    const cipVulns = (cip.vulnerabilities as number) ?? 0;
    const cipMalicious = (cip.maliciousCount as number) ?? 0;
    if (cipVulns > 0 || cipMalicious > 0) {
      const parts: string[] = [];
      if (cipVulns > 0) parts.push(`${cipVulns} vulnerabilities`);
      if (cipMalicious > 0) parts.push(`${cipMalicious} malicious activity detections`);
      threats.push({
        source: "Criminal IP",
        description: parts.join(", "),
        date: new Date().toISOString().slice(0, 10),
        severity: cipMalicious > 5 || cipVulns > 10 ? "critical" : cipMalicious > 0 ? "high" : "medium",
      });
    }
    // Flag VPN/Tor/Proxy/Darkweb
    const flags: string[] = [];
    if (cip.isVPN) flags.push("VPN");
    if (cip.isTor) flags.push("Tor");
    if (cip.isProxy) flags.push("Proxy");
    if (cip.isDarkweb) flags.push("Darkweb");
    if (cip.isScanner) flags.push("Scanner");
    if (flags.length > 0) {
      threats.push({
        source: "Criminal IP",
        description: `Detected as: ${flags.join(", ")}`,
        date: new Date().toISOString().slice(0, 10),
        severity: flags.includes("Darkweb") ? "critical" : "medium",
      });
    }
  }

  // Abusix blocklist signals
  if (abusix?.listed) {
    const categories = (abusix.categories as string[]) ?? [];
    const level = (abusix.threatLevel as string) ?? "unknown";
    threats.push({
      source: "Abusix",
      description: `Listed on Abusix blocklist (threat level: ${level})${categories.length > 0 ? ` — categories: ${categories.slice(0, 3).join(", ")}` : ""}`,
      date: (abusix.lastSeen as string)?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      severity: level === "critical" || level === "high" ? "high" : "medium",
    });
  }

  // AlienVault OTX Threat Pulses
  if (otx && typeof otx.pulseCount === "number" && otx.pulseCount > 0) {
    const pulseList = (otx.pulses as { name: string; author: string }[]) || [];
    const topNames = pulseList.slice(0, 2).map((p) => p.name).filter(Boolean).join(", ");
    threats.push({
      source: "AlienVault OTX",
      description: `Associated with ${otx.pulseCount} threat pulse${otx.pulseCount > 1 ? "s" : ""}${topNames ? ` (${topNames})` : ""}`,
      date: new Date().toISOString().slice(0, 10),
      severity: otx.pulseCount > 5 ? "critical" : otx.pulseCount > 1 ? "high" : "medium",
    });
  }

  // Add latest abuse reports as threats
  const reports = (abuse?.reports as { reportedAt: string; comment: string; categories: number[] }[]) ?? [];
  for (const report of reports.slice(0, 2)) {
    if (report.comment) {
      threats.push({
        source: "AbuseIPDB Report",
        description: report.comment.slice(0, 150),
        date: report.reportedAt?.slice(0, 10) || "",
        severity: "medium",
      });
    }
  }

  return threats;
}

function parseWhoisString(whois: string): Record<string, string> {
  if (!whois) return {};
  const result: Record<string, string> = {};
  const lines = whois.split("\n");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (
        key &&
        value &&
        !result[key] &&
        [
          "Registrar",
          "Creation Date",
          "Updated Date",
          "Registry Expiry Date",
          "Name Server",
          "Registrant Organization",
          "Registrant Country",
          "Admin Email",
        ].some((k) => key.includes(k) || k.includes(key))
      ) {
        result[key] = value;
      }
    }
  }
  return result;
}

// ============================================================
// Merged Domain Lookup
// ============================================================
export async function mergedDomainLookup(domain: string) {
  const [vt, shodanDns, cipDomain, otxDomain, alphaDomain, urlqueryDomain] = await Promise.all([
    vtLookupDomain(domain),
    shodanResolveDomain(domain),
    criminalIPScanDomain(domain),
    otxLookupDomain(domain),
    alphaMountainLookupURI(domain),
    urlqueryLookup(domain),
  ]);

  // If Shodan resolved an IP, also look it up
  let shodanHost = null;
  const resolvedIP = (shodanDns as { resolvedIP: string })?.resolvedIP;
  if (resolvedIP) {
    shodanHost = await shodanLookupIP(resolvedIP);
  }

  const sources: string[] = [];
  if (vt) sources.push("VirusTotal");
  if (shodanDns) sources.push("Shodan");
  if (cipDomain) sources.push("Criminal IP");
  if (otxDomain) sources.push("AlienVault OTX");
  if (alphaDomain) sources.push("alphaMountain.ai");
  if (urlqueryDomain) sources.push("URLQuery");

  const vtMalicious = (vt?.lastAnalysisStats as Record<string, number>)?.malicious ?? 0;
  const vtTotal =
    vtMalicious +
    ((vt?.lastAnalysisStats as Record<string, number>)?.undetected ?? 0) +
    ((vt?.lastAnalysisStats as Record<string, number>)?.harmless ?? 0);
  const vtRisk =
    vtTotal > 0 ? Math.min(100, Math.round((vtMalicious / vtTotal) * 100)) : 0;

  // Criminal IP domain risk
  const cipPhishing = typeof cipDomain?.phishingScore === "number" ? cipDomain.phishingScore : 0;
  const cipMalware = typeof cipDomain?.malwareScore === "number" ? cipDomain.malwareScore : 0;
  const cipDomainRisk = Math.max(cipPhishing, cipMalware);

  // OTX & alphaMountain risk
  const otxRisk = (otxDomain?.pulseCount as number) > 0 ? Math.min(100, (otxDomain?.pulseCount as number) * 15) : 0;
  const alphaRisk = typeof alphaDomain?.riskScore === "number" ? alphaDomain.riskScore : 0;

  const riskScore = Math.min(100, Math.max(vtRisk, cipDomainRisk, otxRisk, alphaRisk));

  // Parse DNS records from VT
  const dnsRecords = ((vt?.lastDnsRecords as Record<string, unknown>[]) ?? []).map(
    (r) => ({
      type: r.type ?? "",
      name: domain,
      value: r.value ?? "",
      ttl: r.ttl ?? 0,
    })
  );

  // Parse SSL cert
  const cert = vt?.lastHttpsCertificate as Record<string, unknown> | null;
  const sslCert = cert
    ? {
        issuer: (cert.issuer as Record<string, string>)?.O ?? (cipDomain?.certIssuer as string) ?? "",
        validFrom: cert.validity
          ? (cert.validity as Record<string, string>)?.not_before ?? ""
          : "",
        validTo: cert.validity
          ? (cert.validity as Record<string, string>)?.not_after ?? ""
          : (cipDomain?.certValidTo as string) ?? "",
        subject: (cert.subject as Record<string, string>)?.CN ?? domain,
        serialNumber: (cert.serial_number as string) ?? "",
        fingerprint: (cert.thumbprint as string) ?? "",
      }
    : cipDomain?.certIssuer
      ? {
          issuer: cipDomain.certIssuer as string,
          validFrom: "",
          validTo: (cipDomain.certValidTo as string) ?? "",
          subject: domain,
          serialNumber: "",
          fingerprint: "",
        }
      : null;

  const whoisData = parseWhoisString((vt?.whois as string) || "");

  // Build domain-specific threats
  const domainThreats: { source: string; description: string; date: string; severity: string }[] = [];
  if (vtMalicious > 0) {
    domainThreats.push({
      source: "VirusTotal",
      description: `Detected as malicious by ${vtMalicious} security vendors`,
      date: new Date().toISOString().slice(0, 10),
      severity: vtMalicious > 10 ? "critical" : vtMalicious > 3 ? "high" : "medium",
    });
  }
  if (cipPhishing > 50) {
    domainThreats.push({
      source: "Criminal IP",
      description: `Phishing risk score: ${cipPhishing}%`,
      date: new Date().toISOString().slice(0, 10),
      severity: cipPhishing > 80 ? "critical" : "high",
    });
  }
  if (cipMalware > 50) {
    domainThreats.push({
      source: "Criminal IP",
      description: `Malware risk score: ${cipMalware}%`,
      date: new Date().toISOString().slice(0, 10),
      severity: cipMalware > 80 ? "critical" : "high",
    });
  }
  if (otxDomain && (otxDomain.pulseCount as number) > 0) {
    const count = otxDomain.pulseCount as number;
    domainThreats.push({
      source: "AlienVault OTX",
      description: `Flagged in ${count} threat pulse${count > 1 ? "s" : ""}`,
      date: new Date().toISOString().slice(0, 10),
      severity: count > 5 ? "critical" : count > 1 ? "high" : "medium",
    });
  }
  if (alphaDomain && (alphaDomain.riskScore as number) >= 50) {
    domainThreats.push({
      source: "alphaMountain.ai",
      description: `AI Risk Score: ${(alphaDomain.threatScore as number).toFixed(2)}/5.0 (${(alphaDomain.severity as string).toUpperCase()})`,
      date: new Date().toISOString().slice(0, 10),
      severity: alphaDomain.severity as string,
    });
  }

  return {
    domain,
    registrar: vt?.registrar || whoisData["Registrar"] || "Unknown",
    registeredDate: (vt?.creationDate as string) || whoisData["Creation Date"] || "",
    expiryDate: whoisData["Registry Expiry Date"] || "",
    nameservers: dnsRecords
      .filter((r) => r.type === "NS")
      .map((r) => r.value),
    status: [],
    country: whoisData["Registrant Country"] || (cipDomain?.country as string) || (shodanHost as Record<string, string>)?.country || "",
    reputation: riskScore,
    dnsRecords,
    sslCert,
    resolvedIP: resolvedIP || (cipDomain?.ip as string) || null,
    ports: (shodanHost as Record<string, number[]>)?.ports ?? [],
    categories: vt?.categories ?? {},
    vtAnalysisStats: vt?.lastAnalysisStats ?? null,
    criminalIP: cipDomain ? {
      phishingScore: cipDomain.phishingScore,
      malwareScore: cipDomain.malwareScore,
      title: cipDomain.title,
      technologies: cipDomain.technologies,
    } : null,
    otx: otxDomain ? {
      pulseCount: otxDomain.pulseCount,
      pulses: otxDomain.pulses,
      alexa: otxDomain.alexa,
      validation: otxDomain.validation,
    } : null,
    alphaMountain: alphaDomain ? {
      threatScore: alphaDomain.threatScore,
      riskScore: alphaDomain.riskScore,
      categories: alphaDomain.categories,
      confidence: alphaDomain.confidence,
      source: alphaDomain.source,
    } : null,
    urlquery: urlqueryDomain ? {
      totalHits: urlqueryDomain.totalHits,
      reports: urlqueryDomain.reports,
    } : null,
    threats: domainThreats,
    sources,
    riskScore,
    severity: scoreToSeverity(riskScore),
  };
}

// ============================================================
// Merged Hash Lookup (VirusTotal + AlienVault OTX)
// ============================================================
export async function mergedHashLookup(hash: string) {
  const [vtData, otxData] = await Promise.all([
    vtLookupHash(hash),
    otxLookupHash(hash),
  ]);

  const sources: string[] = [];
  if (vtData) sources.push("VirusTotal");
  if (otxData && (otxData.pulseCount as number) > 0) sources.push("AlienVault OTX");

  if (!vtData && (!otxData || (otxData.pulseCount as number) === 0)) {
    return {
      hash,
      sources: [],
      riskScore: 0,
      severity: "info",
      error: "Hash not found in VirusTotal or AlienVault OTX databases.",
    };
  }

  let vtScore = 0;
  let detectionRate = "0/0";
  if (vtData) {
    const stats = vtData.lastAnalysisStats as Record<string, number>;
    const malicious = (stats?.malicious ?? 0) + (stats?.suspicious ?? 0);
    const total = malicious + (stats?.undetected ?? 0) + (stats?.harmless ?? 0);
    vtScore = total > 0 ? Math.min(100, Math.round((malicious / total) * 100)) : 0;
    detectionRate = `${malicious}/${total}`;
  }

  const otxPulseCount = (otxData?.pulseCount as number) || 0;
  const otxScore = otxPulseCount > 0 ? Math.min(100, otxPulseCount * 20) : 0;
  const riskScore = Math.min(100, Math.max(vtScore, otxScore));

  const allTags = [
    ...((vtData?.tags as string[]) || []),
    ...(((otxData?.pulses as { tags: string[] }[]) || []).flatMap((p) => p.tags || [])),
  ];

  return {
    hash,
    meaningfulName: vtData?.meaningfulName || (otxData?.pulses as { name: string }[])?.[0]?.name || "File Hash Analysis",
    fileType: vtData?.fileType || "",
    fileSize: vtData?.fileSize || 0,
    md5: vtData?.md5 || "",
    sha1: vtData?.sha1 || "",
    sha256: vtData?.sha256 || hash,
    detectionRate,
    lastAnalysisStats: vtData?.lastAnalysisStats || null,
    tags: [...new Set(allTags)].slice(0, 15),
    otx: otxData ? {
      pulseCount: otxData.pulseCount,
      pulses: otxData.pulses,
      adversary: otxData.adversary,
      malwareFamilies: otxData.malwareFamilies,
    } : null,
    sources,
    riskScore,
    severity: scoreToSeverity(riskScore),
  };
}

// ============================================================
// Merged URL Lookup (Two-Layer Local Heuristics + Multi-Vendor Intel)
// ============================================================
export async function mergedURLLookup(url: string) {
  const { analyzeURL } = await import("./url-analysis-service");
  const analysis = await analyzeURL(url);

  return {
    url: analysis.url,
    riskScore: analysis.riskScore,
    severity: analysis.severity,
    verdict: analysis.verdict,
    threatLevel: analysis.threatLevel,
    sources: analysis.sources,
    riskFactors: analysis.riskFactors,
    riskBreakdown: analysis.riskBreakdown,
    structural: analysis.structural,
    urlCharacteristics: analysis.urlCharacteristics,
    domainCharacteristics: analysis.domainCharacteristics,
    threatIntelligence: analysis.threatIntelligence,
    findings: analysis.findings,
    lastAnalysisStats: analysis.threatIntelligence?.virusTotal
      ? {
          malicious: analysis.threatIntelligence.virusTotal.maliciousEngines,
          suspicious: analysis.threatIntelligence.virusTotal.suspiciousEngines,
          harmless: analysis.threatIntelligence.virusTotal.harmlessEngines,
          undetected: analysis.threatIntelligence.virusTotal.undetectedEngines,
        }
      : null,
  };
}
