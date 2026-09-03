// ============================================
// XEROVA — Centralized Threat Intelligence API Client
// ============================================
// Handles VirusTotal, AbuseIPDB, Shodan, NVD, Criminal IP, and Abusix.
// Features: caching, timeouts, parallel requests, graceful degradation.

import { scoreToSeverity } from "./sanitize";
import type {
  IP2LocationData,
  IP2WhoisData,
  HostedDomainsData,
  IPStackData,
  PhishStatsData,
  URLScanData,
  CheckPhishData,
  CloudmersiveData,
} from "../types";

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
export const getVTKey = () => process.env.VIRUSTOTAL_API_KEY || "";

function vtHeaders() {
  return { "x-apikey": getVTKey(), Accept: "application/json" };
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
export const getAbuseKey = () => process.env.ABUSEIPDB_API_KEY || "";

export async function abuseIPDBLookup(ip: string) {
  const key = getAbuseKey();
  if (!key) return null;
  const cacheKey = `abuse:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${ABUSE_BASE}/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose=true`,
      { headers: { Key: key, Accept: "application/json" } }
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
export const getShodanKey = () => process.env.SHODAN_API_KEY || "";

export async function shodanLookupIP(ip: string) {
  const key = getShodanKey();
  if (!key) return null;
  const cacheKey = `shodan:ip:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${SHODAN_BASE}/shodan/host/${ip}?key=${key}&minify=true`
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
  const key = getShodanKey();
  if (!key) return null;
  const cacheKey = `shodan:resolve:${domain}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${SHODAN_BASE}/dns/resolve?hostnames=${domain}&key=${key}`
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
export const getCriminalIPKey = () => process.env.CRIMINAL_IP_API_KEY || "";

function cipHeaders() {
  return { "x-api-key": getCriminalIPKey(), Accept: "application/json" };
}

export async function criminalIPLookupIP(ip: string) {
  if (!getCriminalIPKey()) return null;
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
  if (!getCriminalIPKey()) return null;
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
export const getAbusixKey = () => process.env.ABUSIX_API_KEY || "";

export async function abusixLookupIP(ip: string) {
  const key = getAbusixKey();
  if (!key) return null;
  const cacheKey = `abusix:${ip}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${ABUSIX_BASE}/query/${encodeURIComponent(ip)}`,
      { headers: { "x-api-key": key, Accept: "application/json" } }
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
// AlienVault OTX (Blocked / Disabled)
// ============================================================
export const getOTXKey = () => "";

export async function otxLookupIP(_ip: string) {
  return null;
}

export async function otxLookupDomain(_domain: string) {
  return null;
}

export async function otxLookupURL(_url: string) {
  return null;
}

export async function otxLookupHash(_hash: string) {
  return null;
}

export async function otxGetLivePulses(_limit = 8) {
  return [];
}

// ============================================================
// alphaMountain.ai / ThreatYeti
// ============================================================
const ALPHA_BASE = "https://api.alphamountain.ai";
export const isAlphaMountainEnabled = () => process.env.ENABLE_ALPHA_MOUNTAIN === "true";
export const getAlphaKey = () => process.env.ALPHA_MOUNTAIN_API || process.env.THREATYETI_API_KEY || "";

export async function alphaMountainLookupURI(uri: string) {
  if (!isAlphaMountainEnabled()) return null;
  const key = getAlphaKey();
  if (!key) return null;
  const cacheKey = `alpha:${uri}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const [threatRes, catRes] = await Promise.all([
      safeFetch(`${ALPHA_BASE}/threat/uri/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ license: key, uri, version: "1.0" }),
      }),
      safeFetch(`${ALPHA_BASE}/category/uri/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ license: key, uri, version: "1.0" }),
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
export const getUrlQueryKey = () => process.env.URL_QUERY_API_KEY || "";

export async function urlqueryLookup(query: string) {
  const key = getUrlQueryKey();
  if (!key) return null;
  const cacheKey = `urlquery:${query}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${URLQUERY_BASE}/search/reports/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "x-apikey": key,
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
// Yandex Safe Browsing
// ============================================================
const YANDEX_BASE = "https://sba.yandex.net/v4/threatMatches:find";
export const getYandexKey = () => process.env.YANDEX_API_KEY || "";

export interface YandexThreatMatch {
  threatType: string;
  platformType: string;
  threatEntryType: string;
}

export interface YandexSafeBrowsingResult {
  isSafe: boolean;
  matches: YandexThreatMatch[];
}

export async function yandexSafeBrowsingLookup(url: string): Promise<YandexSafeBrowsingResult | null> {
  const key = getYandexKey();
  if (!key) return null;
  const cacheKey = `yandex:${url}`;
  const cached = getCached<YandexSafeBrowsingResult>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${YANDEX_BASE}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client: { clientId: "xerova-platform", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM", "WINDOWS", "LINUX", "ANDROID", "IOS"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const rawMatches = Array.isArray(data?.matches) ? data.matches : [];
    const matches: YandexThreatMatch[] = rawMatches.map((m: Record<string, unknown>) => ({
      threatType: String(m.threatType || "MALWARE"),
      platformType: String(m.platformType || "ANY_PLATFORM"),
      threatEntryType: String(m.threatEntryType || "URL"),
    }));

    const result: YandexSafeBrowsingResult = {
      isSafe: matches.length === 0,
      matches,
    };

    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[Yandex] Safe Browsing lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// Google Safe Browsing
// ============================================================
const GOOGLE_SAFE_BROWSING_BASE = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
export const getGoogleSafeBrowsingKey = () =>
  process.env.GOOGLE_SAFE_BROWSING_API_KEY ||
  process.env.GOOGLE_SAFEBROWSING_API_KEY ||
  process.env.SAFE_BROWSING_API_KEY ||
  "";

export interface GoogleThreatMatch {
  threatType: string;
  platformType: string;
  threatEntryType: string;
  url?: string;
}

export interface GoogleSafeBrowsingResult {
  isSafe: boolean;
  isThreat: boolean;
  threatTypes: string[];
  platformTypes: string[];
  matches: GoogleThreatMatch[];
}

export async function googleSafeBrowsingLookup(url: string): Promise<GoogleSafeBrowsingResult | null> {
  const key = getGoogleSafeBrowsingKey();
  if (!key) return null;
  const cleanUrl = url.trim();
  const cacheKey = `gsb:${cleanUrl}`;
  const cached = getCached<GoogleSafeBrowsingResult>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(`${GOOGLE_SAFE_BROWSING_BASE}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client: { clientId: "xerova-guard", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: cleanUrl }],
        },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const rawMatches = Array.isArray(data?.matches) ? data.matches : [];
    const matches: GoogleThreatMatch[] = rawMatches.map((m: Record<string, unknown>) => ({
      threatType: String(m.threatType || "MALWARE"),
      platformType: String(m.platformType || "ANY_PLATFORM"),
      threatEntryType: String(m.threatEntryType || "URL"),
      url: (m.threat as Record<string, string>)?.url,
    }));

    const threatTypes = [...new Set(matches.map((m) => m.threatType))];
    const platformTypes = [...new Set(matches.map((m) => m.platformType))];
    const isThreat = matches.length > 0;

    const result: GoogleSafeBrowsingResult = {
      isSafe: !isThreat,
      isThreat,
      threatTypes,
      platformTypes,
      matches,
    };

    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[Google Safe Browsing] Lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// VXVault Live Malware URL Feed
// ============================================================
const VXVAULT_FEED_URL = "http://vxvault.net/URL_List.php";
let vxvaultMemoryCache: { urls: Set<string>; list: string[]; timestamp: number } | null = null;
const VXVAULT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getVXVaultMaliciousURLs(): Promise<string[]> {
  const now = Date.now();
  if (vxvaultMemoryCache && now - vxvaultMemoryCache.timestamp < VXVAULT_CACHE_TTL) {
    return vxvaultMemoryCache.list;
  }

  try {
    const res = await safeFetch(
      VXVAULT_FEED_URL,
      {
        headers: {
          "User-Agent": "XEROVA-Threat-Intel/1.0",
          Accept: "text/plain,text/html,*/*",
        },
      },
      8000
    );

    if (res.ok) {
      const text = await res.text();
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#"));

      const urlSet = new Set(lines.map((u) => u.toLowerCase()));
      vxvaultMemoryCache = {
        urls: urlSet,
        list: lines,
        timestamp: now,
      };
      return lines;
    }
  } catch (e) {
    console.error("[VXVault] Live feed fetch failed:", (e as Error).message);
  }

  return vxvaultMemoryCache ? vxvaultMemoryCache.list : [];
}

export async function vxvaultLookupURL(url: string): Promise<{ listed: boolean; matchUrl?: string } | null> {
  try {
    const maliciousUrls = await getVXVaultMaliciousURLs();
    if (!maliciousUrls || maliciousUrls.length === 0) {
      return { listed: false };
    }

    const cleanInput = url.trim().toLowerCase();
    const inputWithoutProto = cleanInput.replace(/^https?:\/\//i, "").replace(/\/$/, "");

    for (const m of maliciousUrls) {
      const cleanM = m.trim().toLowerCase();
      const mWithoutProto = cleanM.replace(/^https?:\/\//i, "").replace(/\/$/, "");

      if (
        cleanInput === cleanM ||
        inputWithoutProto === mWithoutProto ||
        (cleanM.length > 5 && (cleanInput.includes(cleanM) || cleanM.includes(inputWithoutProto)))
      ) {
        return { listed: true, matchUrl: m };
      }
    }

    return { listed: false };
  } catch (e) {
    console.error("[VXVault] Lookup failed:", (e as Error).message);
    return null;
  }
}

export async function vxvaultGetLiveFeed(limit = 10): Promise<Array<{ url: string; source: string; timestamp: string }>> {
  const urls = await getVXVaultMaliciousURLs();
  const now = new Date().toISOString();
  return urls.slice(0, limit).map((u) => ({
    url: u,
    source: "VXVault",
    timestamp: now,
  }));
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
// IP2Location (IP Geolocation & Threat Signals)
// ============================================================
const IP2LOCATION_BASE = "https://api.ip2location.io";
export const getIP2LocationKey = () =>
  process.env.IP2LOCATION_API_KEY || process.env.IP2WHOIS_API_KEY || "";

export async function ip2LocationLookup(ip: string): Promise<IP2LocationData | null> {
  const key = getIP2LocationKey();
  if (!key) return null;
  const cleanIP = ip.trim();
  const cacheKey = `ip2loc:ip:${cleanIP}`;
  const cached = getCached<IP2LocationData>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${IP2LOCATION_BASE}/?key=${encodeURIComponent(key)}&ip=${encodeURIComponent(cleanIP)}`
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d?.error) return null;

    const result: IP2LocationData = {
      ip: d.ip || cleanIP,
      countryCode: d.country_code || "",
      countryName: d.country_name || "",
      regionName: d.region_name || "",
      cityName: d.city_name || "",
      latitude: typeof d.latitude === "number" ? d.latitude : parseFloat(d.latitude) || 0,
      longitude: typeof d.longitude === "number" ? d.longitude : parseFloat(d.longitude) || 0,
      zipCode: d.zip_code || "",
      timeZone: d.time_zone || "",
      asn: d.asn ? (String(d.asn).startsWith("AS") ? String(d.asn) : `AS${d.asn}`) : "",
      asName: d.as || "",
      isProxy: Boolean(d.is_proxy),
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[IP2Location] Lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// IP2WHOIS (Domain WHOIS & Hosted Domains)
// ============================================================
const IP2WHOIS_BASE = "https://api.ip2whois.com/v2";
const IP2WHOIS_HOSTED_BASE = "https://domains.ip2whois.com/domains";
export const getIP2WhoisKey = () =>
  process.env.IP2WHOIS_API_KEY || process.env.IP2LOCATION_API_KEY || "";

export async function ip2WhoisLookup(domain: string): Promise<IP2WhoisData | null> {
  const key = getIP2WhoisKey();
  if (!key) return null;
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
  const cacheKey = `ip2whois:domain:${cleanDomain}`;
  const cached = getCached<IP2WhoisData>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${IP2WHOIS_BASE}?key=${encodeURIComponent(key)}&domain=${encodeURIComponent(cleanDomain)}`
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d?.error) return null;

    const result: IP2WhoisData = {
      domain: d.domain || cleanDomain,
      domainId: d.domain_id || "",
      status: d.status || "",
      createDate: d.create_date || "",
      updateDate: d.update_date || "",
      expireDate: d.expire_date || "",
      domainAge: typeof d.domain_age === "number" ? d.domain_age : parseInt(d.domain_age, 10) || undefined,
      whoisServer: d.whois_server || "",
      registrar: {
        ianaId: d.registrar?.iana_id || "",
        name: d.registrar?.name || "",
        url: d.registrar?.url || "",
      },
      registrant: {
        name: d.registrant?.name || "",
        organization: d.registrant?.organization || "",
        streetAddress: d.registrant?.street_address || "",
        city: d.registrant?.city || "",
        region: d.registrant?.region || "",
        zipCode: d.registrant?.zip_code || "",
        country: d.registrant?.country || "",
        phone: d.registrant?.phone || "",
        fax: d.registrant?.fax || "",
        email: d.registrant?.email || "",
      },
      admin: {
        name: d.admin?.name || "",
        organization: d.admin?.organization || "",
        streetAddress: d.admin?.street_address || "",
        city: d.admin?.city || "",
        region: d.admin?.region || "",
        zipCode: d.admin?.zip_code || "",
        country: d.admin?.country || "",
        phone: d.admin?.phone || "",
        fax: d.admin?.fax || "",
        email: d.admin?.email || "",
      },
      tech: {
        name: d.tech?.name || "",
        organization: d.tech?.organization || "",
        streetAddress: d.tech?.street_address || "",
        city: d.tech?.city || "",
        region: d.tech?.region || "",
        zipCode: d.tech?.zip_code || "",
        country: d.tech?.country || "",
        phone: d.tech?.phone || "",
        fax: d.tech?.fax || "",
        email: d.tech?.email || "",
      },
      billing: {
        name: d.billing?.name || "",
        organization: d.billing?.organization || "",
        streetAddress: d.billing?.street_address || "",
        city: d.billing?.city || "",
        region: d.billing?.region || "",
        zipCode: d.billing?.zip_code || "",
        country: d.billing?.country || "",
        phone: d.billing?.phone || "",
        fax: d.billing?.fax || "",
        email: d.billing?.email || "",
      },
      nameservers: Array.isArray(d.nameservers) ? d.nameservers : [],
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[IP2WHOIS] Domain lookup failed:", (e as Error).message);
    return null;
  }
}

export async function ip2WhoisHostedDomains(ip: string, page = 1): Promise<HostedDomainsData | null> {
  const key = getIP2WhoisKey();
  if (!key) return null;
  const cleanIP = ip.trim();
  const cacheKey = `ip2whois:hosted:${cleanIP}:${page}`;
  const cached = getCached<HostedDomainsData>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${IP2WHOIS_HOSTED_BASE}?key=${encodeURIComponent(key)}&ip=${encodeURIComponent(cleanIP)}&page=${page}`
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d?.error) return null;

    const result: HostedDomainsData = {
      ip: d.ip || cleanIP,
      totalDomains: typeof d.total_domains === "number" ? d.total_domains : parseInt(d.total_domains, 10) || 0,
      page: d.page ?? page,
      perPage: d.per_page ?? (Array.isArray(d.domains) ? d.domains.length : 0),
      totalPages: d.total_pages ?? 1,
      domains: Array.isArray(d.domains) ? d.domains : [],
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[IP2WHOIS] Hosted domains lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// IPStack (IP Geolocation & Threat Detection)
// ============================================================
export const getIPStackKey = () => process.env.IPSTACK_API_KEY || "";

export async function ipstackLookupIP(ip: string): Promise<IPStackData | null> {
  const key = getIPStackKey();
  if (!key) return null;
  const cleanIP = ip.trim();
  const cacheKey = `ipstack:ip:${cleanIP}`;
  const cached = getCached<IPStackData>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `http://api.ipstack.com/${encodeURIComponent(cleanIP)}?access_key=${encodeURIComponent(key)}&security=1`
    );
    if (!res.ok) return null;
    const d = await res.json();
    if (d?.error || !d?.ip) return null;

    const security = d.security
      ? {
          isProxy: Boolean(d.security.is_proxy),
          proxyType: d.security.proxy_type || undefined,
          isCrawler: Boolean(d.security.is_crawler),
          crawlerName: d.security.crawler_name || undefined,
          crawlerType: d.security.crawler_type || undefined,
          isTor: Boolean(d.security.is_tor),
          threatLevel: d.security.threat_level || "low",
          threatTypes: Array.isArray(d.security.threat_types) ? d.security.threat_types : [],
        }
      : undefined;

    const result: IPStackData = {
      ip: d.ip || cleanIP,
      type: d.type || "ipv4",
      continentCode: d.continent_code || "",
      continentName: d.continent_name || "",
      countryCode: d.country_code || "",
      countryName: d.country_name || "",
      regionCode: d.region_code || "",
      regionName: d.region_name || "",
      city: d.city || "",
      zip: d.zip || "",
      latitude: typeof d.latitude === "number" ? d.latitude : parseFloat(d.latitude) || 0,
      longitude: typeof d.longitude === "number" ? d.longitude : parseFloat(d.longitude) || 0,
      asn: d.connection?.asn ? `AS${d.connection.asn}` : undefined,
      isp: d.connection?.isp || undefined,
      security,
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[IPStack] Lookup failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// PhishStats (Real-Time Phishing Threat Intelligence)
// ============================================================
export const getPhishStatsKey = () => process.env.PHISHSTATS_API_KEY || "";

export async function phishstatsLookupURL(url: string): Promise<PhishStatsData | null> {
  const key = getPhishStatsKey();
  const cleanUrl = url.trim().toLowerCase();
  const cacheKey = `phishstats:url:${cleanUrl}`;
  const cached = getCached<PhishStatsData>(cacheKey);
  if (cached) return cached;

  try {
    const cleanDomain = cleanUrl.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
    const headers: Record<string, string> = { Accept: "application/json" };
    if (key) {
      headers["Authorization"] = `Bearer ${key}`;
      headers["apikey"] = key;
    }

    let res = await safeFetch(
      `https://api.phishstats.info/api/v1/urls?url=${encodeURIComponent(url)}`,
      { headers },
      8000
    );
    if (!res.ok) {
      res = await safeFetch(
        `https://phishstats.info/api/phishing?_where=(url,like,~${encodeURIComponent(cleanDomain)}~)&_sort=-id&_size=1`,
        { headers },
        8000
      );
    }
    if (!res.ok) return null;
    const json = await res.json();
    const item = Array.isArray(json) ? json[0] : Array.isArray(json?.data) ? json.data[0] : json?.data || json;
    if (!item || (!item.url && !item.score && !item.phish_score)) return null;

    const rawScore = typeof item.score === "number" ? item.score : typeof item.phish_score === "number" ? item.phish_score : typeof item.score === "string" ? parseFloat(item.score) : 0;
    const tags = Array.isArray(item.tags)
      ? item.tags
      : typeof item.tags === "string"
        ? item.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : typeof item.tag === "string"
          ? [item.tag]
          : [];

    const result: PhishStatsData = {
      id: item.id ? String(item.id) : undefined,
      url: item.url || url,
      domain: item.domain || cleanDomain,
      ip: item.ip || undefined,
      country: item.country_name || item.country || undefined,
      countryCode: item.country_code || undefined,
      asn: item.asn || undefined,
      score: rawScore,
      tags,
      targetBrand: item.target || item.brand || undefined,
      title: item.title || undefined,
      threatType: item.threat_type || "Phishing",
      date: item.date || item.created_at || undefined,
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[PhishStats] URL lookup failed:", (e as Error).message);
    return null;
  }
}

export async function phishstatsLookupDomain(domain: string): Promise<PhishStatsData | null> {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
  return phishstatsLookupURL(`http://${cleanDomain}`);
}

// ============================================================
// urlscan.io (Automated Web Sandbox & Scanner)
// ============================================================
export const getUrlscanKey = () => process.env.URLSCAN_IO_API_KEY || "";

export async function urlscanLookup(target: string): Promise<URLScanData | null> {
  const key = getUrlscanKey();
  const cleanTarget = target.trim();
  const cacheKey = `urlscan:${cleanTarget}`;
  const cached = getCached<URLScanData>(cacheKey);
  if (cached) return cached;

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (key) headers["API-Key"] = key;

    const cleanDomain = cleanTarget.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
    const isDomain = !cleanTarget.includes("/") || cleanTarget.startsWith("http") === false;
    const query = isDomain ? `page.domain:"${cleanDomain}"` : `page.url:"${cleanTarget}" OR page.domain:"${cleanDomain}"`;

    const res = await safeFetch(
      `https://urlscan.io/api/v1/search/?q=${encodeURIComponent(query)}&size=1`,
      { headers },
      10_000
    );
    if (!res.ok) return null;
    const json = await res.json();
    const item = json?.results?.[0];
    if (!item) return null;

    const page = item.page || {};
    const verdicts = item.verdicts?.overall || item.verdicts?.engines || {};
    const malicious = Boolean(verdicts.malicious || (verdicts.score && verdicts.score > 0));
    const score = typeof verdicts.score === "number" ? verdicts.score : malicious ? 100 : 0;
    const categories = Array.isArray(verdicts.categories) ? verdicts.categories : [];
    const technologies = (item.stats?.technologies || []).map((t: Record<string, string>) => t.name || "").filter(Boolean);

    const result: URLScanData = {
      uuid: item._id || item.task?.uuid || "",
      url: page.url || cleanTarget,
      domain: page.domain || cleanDomain,
      ip: page.ip || undefined,
      country: page.country || undefined,
      asn: page.asn || undefined,
      server: page.server || undefined,
      screenshotUrl: item.screenshot || (item._id ? `https://urlscan.io/screenshots/${item._id}.png` : undefined),
      reportUrl: item.result || (item._id ? `https://urlscan.io/result/${item._id}/` : undefined),
      malicious,
      score,
      categories,
      technologies,
      status: page.status,
      title: page.title || undefined,
      date: item.task?.time || undefined,
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[urlscan.io] Search failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// CheckPhish.ai / Bolster AI URL Scanner
// ============================================================
export const getCheckPhishKey = () => process.env.CHECKPHISH_API_KEY || "";

export async function checkphishScanURL(url: string): Promise<CheckPhishData | null> {
  const key = getCheckPhishKey();
  if (!key) return null;
  const cleanUrl = url.trim();
  const cacheKey = `checkphish:${cleanUrl}`;
  const cached = getCached<CheckPhishData>(cacheKey);
  if (cached) return cached;

  try {
    const scanRes = await safeFetch(
      `https://api.checkphish.ai/api/neo/scan`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          apiKey: key,
          urlInfo: { url: cleanUrl },
          url: cleanUrl,
        }),
      },
      10_000
    );

    if (!scanRes.ok) return null;
    const scanJson = await scanRes.json();
    const jobId = scanJson.jobID || scanJson.job_id;
    if (!jobId) return null;

    // Small delay to allow inference
    await new Promise((r) => setTimeout(r, 2500));

    const statusRes = await safeFetch(
      `https://api.checkphish.ai/api/neo/scan/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          apiKey: key,
          jobID: jobId,
        }),
      },
      10_000
    );

    if (!statusRes.ok) return null;
    const statusJson = await statusRes.json();

    const disposition = statusJson.disposition
      ? (statusJson.disposition.toLowerCase() as "phish" | "clean" | "suspicious")
      : statusJson.status === "DONE" && statusJson.url_sha256
        ? "clean"
        : "unknown";

    const result: CheckPhishData = {
      jobId,
      url: cleanUrl,
      status: statusJson.status || "DONE",
      disposition: disposition === "phish" || disposition === "suspicious" || disposition === "clean" ? disposition : "unknown",
      brand: statusJson.brand || undefined,
      insights: statusJson.insights || undefined,
      scanTime: statusJson.scan_time || undefined,
      screenshotUrl: statusJson.screenshot_url || undefined,
      resolved: Boolean(statusJson.resolved),
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[CheckPhish.ai] Scan failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// Cloudmersive Security & Anti-Malware Detection
// ============================================================
const CLOUDMERSIVE_BASE = "https://api.cloudmersive.com";
export const getCloudmersiveKey = () => process.env.CLOUDMERSIVE_API_KEY || "";

export async function cloudmersiveScanURL(url: string): Promise<CloudmersiveData | null> {
  const key = getCloudmersiveKey();
  if (!key) return null;
  const cleanUrl = url.trim();
  const cacheKey = `cloudmersive:url:${cleanUrl}`;
  const cached = getCached<CloudmersiveData>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${CLOUDMERSIVE_BASE}/virus/scan/website`,
      {
        method: "POST",
        headers: {
          Apikey: key,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ Url: cleanUrl }),
      },
      12_000
    );
    if (!res.ok) return null;
    const json = await res.json();

    const foundViruses = Array.isArray(json.FoundViruses)
      ? json.FoundViruses.map((v: Record<string, string>) => ({
          fileName: v.FileName || "",
          virusName: v.VirusName || "",
        }))
      : [];

    const result: CloudmersiveData = {
      cleanResult: json.CleanResult !== false && foundViruses.length === 0,
      websiteThreatType: json.WebsiteThreatType || "None",
      foundViruses,
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[Cloudmersive] Website scan failed:", (e as Error).message);
    return null;
  }
}

export async function cloudmersiveScanIP(ip: string): Promise<CloudmersiveData | null> {
  const key = getCloudmersiveKey();
  if (!key) return null;
  const cleanIP = ip.trim();
  const cacheKey = `cloudmersive:ip:${cleanIP}`;
  const cached = getCached<CloudmersiveData>(cacheKey);
  if (cached) return cached;

  try {
    const res = await safeFetch(
      `${CLOUDMERSIVE_BASE}/security/address/check/ip/threat`,
      {
        method: "POST",
        headers: {
          Apikey: key,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(cleanIP),
      },
      10_000
    );
    if (!res.ok) return null;
    const json = await res.json();

    const isThreat = Boolean(json.IsThreat);
    const result: CloudmersiveData = {
      cleanResult: !isThreat,
      isThreat,
      threatType: json.ThreatType || (isThreat ? "Malicious IP" : "Clean"),
      foundViruses: [],
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[Cloudmersive] IP threat check failed:", (e as Error).message);
    return null;
  }
}

// ============================================================
// Merged IP Lookup (all engines in parallel)
// ============================================================
export async function mergedIPLookup(ip: string) {
  const [vt, abuse, shodan, cip, abusix, ip2loc, hostedDomains, ipstack, cmIP] = await Promise.all([
    vtLookupIP(ip),
    abuseIPDBLookup(ip),
    shodanLookupIP(ip),
    criminalIPLookupIP(ip),
    abusixLookupIP(ip),
    ip2LocationLookup(ip),
    ip2WhoisHostedDomains(ip),
    ipstackLookupIP(ip),
    cloudmersiveScanIP(ip),
  ]);

  const sources: string[] = [];
  if (vt) sources.push("VirusTotal");
  if (abuse) sources.push("AbuseIPDB");
  if (shodan) sources.push("Shodan");
  if (cip) sources.push("Criminal IP");
  if (abusix) sources.push("Abusix");
  if (ip2loc) sources.push("IP2Location");
  if (hostedDomains && hostedDomains.totalDomains > 0) sources.push("IP2WHOIS");
  if (ipstack) sources.push("IPStack");
  if (cmIP) sources.push("Cloudmersive");

  // Merge: prefer AbuseIPDB/IP2Location/IPStack for geo, Shodan for ports, VT for reputation
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

  // IP2Location proxy score contribution
  const ip2locProxyScore = ip2loc?.isProxy ? 35 : 0;

  // IPStack security threat score
  const ipstackThreatScore = ipstack?.security?.threatLevel === "high" || ipstack?.security?.threatLevel === "critical"
    ? 70
    : ipstack?.security?.isProxy || ipstack?.security?.isTor
      ? 35
      : 0;

  // Cloudmersive IP threat check
  const cmThreatScore = cmIP?.isThreat ? 75 : 0;

  // Composite risk score — takes the maximum across all sources
  const riskScore = Math.min(
    100,
    Math.max(
      abuseScore,
      vtScore,
      shodan?.vulns?.length ? 70 : 0,
      cipScore,
      abusixScore,
      ip2locProxyScore,
      ipstackThreatScore,
      cmThreatScore
    )
  );

  const country = ip2loc?.countryName || ipstack?.countryName || abuse?.countryName || (cip?.country as string) || shodan?.country || vt?.country || "Unknown";
  const countryCode = ip2loc?.countryCode || ipstack?.countryCode || abuse?.countryCode || (cip?.countryCode as string) || shodan?.countryCode || "";
  const city = ip2loc?.cityName || ipstack?.city || (cip?.city as string) || shodan?.city || "";
  const region = ip2loc?.regionName || ipstack?.regionName || "";
  const isp = ip2loc?.asName || ipstack?.isp || abuse?.isp || (cip?.isp as string) || shodan?.isp || "";
  const org = shodan?.org || (cip?.org as string) || ip2loc?.asName || ipstack?.isp || vt?.asOwner || "";
  const asn = ip2loc?.asn || ipstack?.asn || shodan?.asn || vt?.asn || "";

  return {
    ip,
    country,
    countryCode,
    city,
    region,
    latitude: ip2loc?.latitude ?? ipstack?.latitude ?? undefined,
    longitude: ip2loc?.longitude ?? ipstack?.longitude ?? undefined,
    zipCode: ip2loc?.zipCode || ipstack?.zip || "",
    timeZone: ip2loc?.timeZone || "",
    isp,
    org,
    asn,
    hostname: (shodan?.hostnames as string[])?.[0] || (abuse?.hostnames as string[])?.[0] || "",
    reputation: riskScore,
    isVPN: (cip?.isVPN as boolean) || (abuse?.usageType as string)?.toLowerCase().includes("vpn") || ipstack?.security?.proxyType?.toLowerCase().includes("vpn") || false,
    isTor: (cip?.isTor as boolean) || abuse?.isTor || ipstack?.security?.isTor || false,
    isProxy: (cip?.isProxy as boolean) || (ip2loc?.isProxy as boolean) || (ipstack?.security?.isProxy as boolean) || (abuse?.usageType as string)?.toLowerCase().includes("proxy") || false,
    isBot: (cip?.isScanner as boolean) || ipstack?.security?.isCrawler || false,
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
    threats: buildThreats(vt, abuse, shodan, cip, abusix, ip2loc, ipstack, cmIP),
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
    otx: null,
    ip2location: ip2loc ? {
      ip: ip2loc.ip,
      countryCode: ip2loc.countryCode,
      countryName: ip2loc.countryName,
      regionName: ip2loc.regionName,
      cityName: ip2loc.cityName,
      latitude: ip2loc.latitude,
      longitude: ip2loc.longitude,
      zipCode: ip2loc.zipCode,
      timeZone: ip2loc.timeZone,
      asn: ip2loc.asn,
      asName: ip2loc.asName,
      isProxy: ip2loc.isProxy,
    } : null,
    ipstack: ipstack ? {
      ip: ipstack.ip,
      type: ipstack.type,
      continentCode: ipstack.continentCode,
      continentName: ipstack.continentName,
      countryCode: ipstack.countryCode,
      countryName: ipstack.countryName,
      regionCode: ipstack.regionCode,
      regionName: ipstack.regionName,
      city: ipstack.city,
      zip: ipstack.zip,
      latitude: ipstack.latitude,
      longitude: ipstack.longitude,
      asn: ipstack.asn,
      isp: ipstack.isp,
      security: ipstack.security,
    } : null,
    hostedDomains: hostedDomains ? {
      ip: hostedDomains.ip,
      totalDomains: hostedDomains.totalDomains,
      page: hostedDomains.page,
      perPage: hostedDomains.perPage,
      totalPages: hostedDomains.totalPages,
      domains: hostedDomains.domains,
    } : null,
    cloudmersive: cmIP ? {
      cleanResult: cmIP.cleanResult,
      isThreat: cmIP.isThreat,
      threatType: cmIP.threatType,
      foundViruses: cmIP.foundViruses,
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
  ip2loc?: IP2LocationData | Record<string, unknown> | null,
  ipstack?: IPStackData | null,
  cmIP?: CloudmersiveData | null
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
      description: `Abuse confidence score: ${abuseScore}% (${abuse?.totalReports ?? 0} total reports)`,
      date: (abuse?.lastReportedAt as string)?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      severity: abuseScore > 75 ? "critical" : abuseScore > 25 ? "high" : "medium",
    });
  }

  // Shodan vulnerabilities
  const vulns = (shodan?.vulns as string[]) ?? [];
  if (vulns.length > 0) {
    threats.push({
      source: "Shodan",
      description: `Identified ${vulns.length} CVE vulnerability/vulnerabilities (${vulns.slice(0, 3).join(", ")})`,
      date: new Date().toISOString().slice(0, 10),
      severity: vulns.length > 3 ? "critical" : "high",
    });
  }

  // Criminal IP malicious inbound alerts
  const cipInbound = (cip?.inboundScore as Record<string, unknown>)?.score;
  if (typeof cipInbound === "number" && cipInbound > 50) {
    threats.push({
      source: "Criminal IP",
      description: `High inbound malicious score: ${cipInbound}%`,
      date: new Date().toISOString().slice(0, 10),
      severity: cipInbound > 80 ? "critical" : "high",
    });
  }

  // Criminal IP network flags (VPN, Tor, Proxy, Darkweb, Scanner)
  if (cip) {
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

  // IP2Location Proxy/VPN Alert
  if (ip2loc?.isProxy) {
    threats.push({
      source: "IP2Location",
      description: "Identified as active Proxy / VPN / Anonymizer exit node",
      date: new Date().toISOString().slice(0, 10),
      severity: "medium",
    });
  }

  // IPStack Security Alert
  if (ipstack?.security) {
    if (ipstack.security.threatLevel === "high" || ipstack.security.threatLevel === "critical") {
      threats.push({
        source: "IPStack Security",
        description: `High security threat detected: ${ipstack.security.threatTypes?.join(", ") || ipstack.security.threatLevel}`,
        date: new Date().toISOString().slice(0, 10),
        severity: ipstack.security.threatLevel === "critical" ? "critical" : "high",
      });
    } else if (ipstack.security.isTor || ipstack.security.isProxy) {
      threats.push({
        source: "IPStack Security",
        description: `Identified as active ${ipstack.security.isTor ? "Tor node" : "Proxy node"} (${ipstack.security.proxyType || "Anonymizer"})`,
        date: new Date().toISOString().slice(0, 10),
        severity: "medium",
      });
    }
  }

  // Cloudmersive IP Threat Alert
  if (cmIP?.isThreat) {
    threats.push({
      source: "Cloudmersive",
      description: `Flagged as malicious threat IP (${cmIP.threatType || "Known Malicious Host"})`,
      date: new Date().toISOString().slice(0, 10),
      severity: "high",
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
  const [vt, shodanDns, cipDomain, alphaDomain, urlqueryDomain, ip2whois, urlscanDomain, phishstatsDomain, gsbDomain] = await Promise.all([
    vtLookupDomain(domain),
    shodanResolveDomain(domain),
    criminalIPScanDomain(domain),
    alphaMountainLookupURI(domain),
    urlqueryLookup(domain),
    ip2WhoisLookup(domain),
    urlscanLookup(domain),
    phishstatsLookupDomain(domain),
    googleSafeBrowsingLookup(domain),
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
  if (alphaDomain) sources.push("alphaMountain.ai");
  if (urlqueryDomain) sources.push("URLQuery");
  if (ip2whois) sources.push("IP2WHOIS");
  if (urlscanDomain) sources.push("urlscan.io");
  if (phishstatsDomain) sources.push("PhishStats");
  if (gsbDomain) sources.push("Google Safe Browsing");

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

  // alphaMountain risk
  const alphaRisk = typeof alphaDomain?.riskScore === "number" ? alphaDomain.riskScore : 0;

  // urlscan.io & PhishStats risk
  const urlscanRisk = urlscanDomain?.malicious ? Math.max(75, urlscanDomain.score) : 0;
  const phishstatsRisk = phishstatsDomain?.score ? Math.min(100, Math.round(phishstatsDomain.score * 10)) : 0;

  // Google Safe Browsing risk
  const gsbRisk = gsbDomain?.isThreat ? 85 : 0;

  // Newly Registered Domain (NRD) risk
  let nrdRisk = 0;
  if (typeof ip2whois?.domainAge === "number") {
    if (ip2whois.domainAge < 30) {
      nrdRisk = 65;
    } else if (ip2whois.domainAge < 90) {
      nrdRisk = 35;
    }
  }

  const riskScore = Math.min(100, Math.max(vtRisk, cipDomainRisk, alphaRisk, nrdRisk, urlscanRisk, phishstatsRisk, gsbRisk));

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
  if (alphaDomain && (alphaDomain.riskScore as number) >= 50) {
    domainThreats.push({
      source: "alphaMountain.ai",
      description: `AI Risk Score: ${(alphaDomain.threatScore as number).toFixed(2)}/5.0 (${(alphaDomain.severity as string).toUpperCase()})`,
      date: new Date().toISOString().slice(0, 10),
      severity: alphaDomain.severity as string,
    });
  }
  if (urlscanDomain?.malicious) {
    domainThreats.push({
      source: "urlscan.io",
      description: `URLScan Sandbox: Flagged as malicious (verdict score: ${urlscanDomain.score})`,
      date: urlscanDomain.date ? urlscanDomain.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      severity: "critical",
    });
  }
  if (phishstatsDomain && phishstatsDomain.score >= 5) {
    domainThreats.push({
      source: "PhishStats",
      description: `PhishStats Threat Score: ${phishstatsDomain.score}/10 (${phishstatsDomain.targetBrand ? `Target: ${phishstatsDomain.targetBrand}` : "Phishing Activity"})`,
      date: phishstatsDomain.date ? phishstatsDomain.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      severity: phishstatsDomain.score >= 8 ? "critical" : "high",
    });
  }
  if (typeof ip2whois?.domainAge === "number") {
    if (ip2whois.domainAge < 30) {
      domainThreats.push({
        source: "IP2WHOIS",
        description: `Newly Registered Domain (NRD): Domain was created ${ip2whois.domainAge} day(s) ago`,
        date: ip2whois.createDate ? ip2whois.createDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        severity: "high",
      });
    } else if (ip2whois.domainAge < 90) {
      domainThreats.push({
        source: "IP2WHOIS",
        description: `Recently Registered Domain: Domain was created ${ip2whois.domainAge} days ago`,
        date: ip2whois.createDate ? ip2whois.createDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        severity: "medium",
      });
    }
  }

  if (gsbDomain?.isThreat) {
    domainThreats.push({
      source: "Google Safe Browsing",
      description: `Google Safe Browsing: Flagged as unsafe (${gsbDomain.threatTypes.join(", ")})`,
      date: new Date().toISOString().slice(0, 10),
      severity: "critical",
    });
  }

  return {
    domain,
    registrar: (ip2whois?.registrar as Record<string, string>)?.name || vt?.registrar || whoisData["Registrar"] || "Unknown",
    registeredDate: (ip2whois?.createDate as string)?.slice(0, 10) || (vt?.creationDate as string) || whoisData["Creation Date"] || "",
    expiryDate: (ip2whois?.expireDate as string)?.slice(0, 10) || whoisData["Registry Expiry Date"] || "",
    domainAge: typeof ip2whois?.domainAge === "number" ? ip2whois.domainAge : null,
    nameservers: (Array.isArray(ip2whois?.nameservers) && ip2whois.nameservers.length > 0)
      ? (ip2whois.nameservers as string[])
      : dnsRecords
          .filter((r) => r.type === "NS")
          .map((r) => r.value),
    status: ip2whois?.status ? [String(ip2whois.status)] : [],
    country: (ip2whois?.registrant as Record<string, string>)?.country || whoisData["Registrant Country"] || (cipDomain?.country as string) || (shodanHost as Record<string, string>)?.country || "",
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
    otx: null,
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
    ip2whois: ip2whois ? {
      domain: ip2whois.domain,
      domainId: ip2whois.domainId,
      status: ip2whois.status,
      createDate: ip2whois.createDate,
      updateDate: ip2whois.updateDate,
      expireDate: ip2whois.expireDate,
      domainAge: ip2whois.domainAge,
      whoisServer: ip2whois.whoisServer,
      registrar: ip2whois.registrar,
      registrant: ip2whois.registrant,
      admin: ip2whois.admin,
      tech: ip2whois.tech,
      billing: ip2whois.billing,
      nameservers: ip2whois.nameservers,
    } : null,
    urlscan: urlscanDomain ? {
      uuid: urlscanDomain.uuid,
      url: urlscanDomain.url,
      domain: urlscanDomain.domain,
      ip: urlscanDomain.ip,
      country: urlscanDomain.country,
      asn: urlscanDomain.asn,
      server: urlscanDomain.server,
      screenshotUrl: urlscanDomain.screenshotUrl,
      reportUrl: urlscanDomain.reportUrl,
      malicious: urlscanDomain.malicious,
      score: urlscanDomain.score,
      categories: urlscanDomain.categories,
      technologies: urlscanDomain.technologies,
      status: urlscanDomain.status,
      title: urlscanDomain.title,
      date: urlscanDomain.date,
    } : null,
    phishstats: phishstatsDomain ? {
      id: phishstatsDomain.id,
      url: phishstatsDomain.url,
      domain: phishstatsDomain.domain,
      score: phishstatsDomain.score,
      tags: phishstatsDomain.tags,
      targetBrand: phishstatsDomain.targetBrand,
      title: phishstatsDomain.title,
      threatType: phishstatsDomain.threatType,
      date: phishstatsDomain.date,
    } : null,
    googleSafeBrowsing: gsbDomain ? {
      isThreat: gsbDomain.isThreat,
      threatTypes: gsbDomain.threatTypes,
      platformTypes: gsbDomain.platformTypes,
    } : null,
    threats: domainThreats,
    sources,
    riskScore,
    severity: scoreToSeverity(riskScore),
  };
}


// ============================================================
// Merged Hash Lookup (VirusTotal)
// ============================================================
export async function mergedHashLookup(hash: string) {
  const vtData = await vtLookupHash(hash);

  const sources: string[] = [];
  if (vtData) sources.push("VirusTotal");

  if (!vtData) {
    return {
      hash,
      sources: [],
      riskScore: 0,
      severity: "info",
      error: "Hash not found in VirusTotal database.",
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

  const riskScore = vtScore;
  const allTags = [...((vtData?.tags as string[]) || [])];

  return {
    hash,
    meaningfulName: vtData?.meaningfulName || "File Hash Analysis",
    fileType: vtData?.fileType || "",
    fileSize: vtData?.fileSize || 0,
    md5: vtData?.md5 || "",
    sha1: vtData?.sha1 || "",
    sha256: vtData?.sha256 || hash,
    detectionRate,
    lastAnalysisStats: vtData?.lastAnalysisStats || null,
    tags: [...new Set(allTags)].slice(0, 15),
    otx: null,
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
    ...analysis,
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
