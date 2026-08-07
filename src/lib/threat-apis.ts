// ============================================
// XEROVA — Centralized Threat Intelligence API Client
// ============================================
// Handles VirusTotal, AbuseIPDB, Shodan, and NVD.
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
// Merged IP Lookup (all 3 APIs in parallel)
// ============================================================
export async function mergedIPLookup(ip: string) {
  const [vt, abuse, shodan] = await Promise.all([
    vtLookupIP(ip),
    abuseIPDBLookup(ip),
    shodanLookupIP(ip),
  ]);

  const sources: string[] = [];
  if (vt) sources.push("VirusTotal");
  if (abuse) sources.push("AbuseIPDB");
  if (shodan) sources.push("Shodan");

  // Merge: prefer AbuseIPDB for geo, Shodan for ports, VT for reputation
  const abuseScore = abuse?.abuseConfidenceScore ?? 0;
  const vtMalicious = (vt?.lastAnalysisStats as Record<string, number>)?.malicious ?? 0;
  const vtTotal =
    vtMalicious +
    ((vt?.lastAnalysisStats as Record<string, number>)?.undetected ?? 0) +
    ((vt?.lastAnalysisStats as Record<string, number>)?.harmless ?? 0);
  const vtScore = vtTotal > 0 ? Math.round((vtMalicious / vtTotal) * 100) : 0;

  // Composite risk score
  const riskScore = Math.min(
    100,
    Math.max(abuseScore, vtScore, shodan?.vulns?.length ? 70 : 0)
  );

  return {
    ip,
    country: abuse?.countryName || shodan?.country || vt?.country || "Unknown",
    countryCode: abuse?.countryCode || shodan?.countryCode || "",
    city: shodan?.city || "",
    isp: abuse?.isp || shodan?.isp || "",
    org: shodan?.org || vt?.asOwner || "",
    asn: shodan?.asn || vt?.asn || "",
    hostname: (shodan?.hostnames as string[])?.[0] || (abuse?.hostnames as string[])?.[0] || "",
    reputation: riskScore,
    isVPN: (abuse?.usageType as string)?.toLowerCase().includes("vpn") ?? false,
    isTor: abuse?.isTor ?? false,
    isProxy:
      (abuse?.usageType as string)?.toLowerCase().includes("proxy") ?? false,
    isBot: false,
    abuseReports: abuse?.totalReports ?? 0,
    lastReportedAt: abuse?.lastReportedAt ?? null,
    ports: (shodan?.ports as number[]) ?? [],
    os: shodan?.os ?? null,
    hostnames: [
      ...new Set([
        ...((shodan?.hostnames as string[]) ?? []),
        ...((abuse?.hostnames as string[]) ?? []),
      ]),
    ],
    threats: buildThreats(vt, abuse, shodan),
    whois: parseWhoisString((vt?.whois as string) || ""),
    vtAnalysisStats: vt?.lastAnalysisStats ?? null,
    sources,
    riskScore,
    severity: scoreToSeverity(riskScore),
  };
}

function buildThreats(
  vt: Record<string, unknown> | null,
  abuse: Record<string, unknown> | null,
  shodan: Record<string, unknown> | null
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
  const [vt, shodanDns] = await Promise.all([
    vtLookupDomain(domain),
    shodanResolveDomain(domain),
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

  const vtMalicious = (vt?.lastAnalysisStats as Record<string, number>)?.malicious ?? 0;
  const vtTotal =
    vtMalicious +
    ((vt?.lastAnalysisStats as Record<string, number>)?.undetected ?? 0) +
    ((vt?.lastAnalysisStats as Record<string, number>)?.harmless ?? 0);
  const riskScore =
    vtTotal > 0 ? Math.min(100, Math.round((vtMalicious / vtTotal) * 100)) : 0;

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
        issuer: (cert.issuer as Record<string, string>)?.O ?? "",
        validFrom: cert.validity
          ? (cert.validity as Record<string, string>)?.not_before ?? ""
          : "",
        validTo: cert.validity
          ? (cert.validity as Record<string, string>)?.not_after ?? ""
          : "",
        subject: (cert.subject as Record<string, string>)?.CN ?? domain,
        serialNumber: (cert.serial_number as string) ?? "",
        fingerprint: (cert.thumbprint as string) ?? "",
      }
    : null;

  const whoisData = parseWhoisString((vt?.whois as string) || "");

  return {
    domain,
    registrar: vt?.registrar || whoisData["Registrar"] || "Unknown",
    registeredDate: (vt?.creationDate as string) || whoisData["Creation Date"] || "",
    expiryDate: whoisData["Registry Expiry Date"] || "",
    nameservers: dnsRecords
      .filter((r) => r.type === "NS")
      .map((r) => r.value),
    status: [],
    country: whoisData["Registrant Country"] || (shodanHost as Record<string, string>)?.country || "",
    reputation: riskScore,
    dnsRecords,
    sslCert,
    resolvedIP: resolvedIP || null,
    ports: (shodanHost as Record<string, number[]>)?.ports ?? [],
    categories: vt?.categories ?? {},
    vtAnalysisStats: vt?.lastAnalysisStats ?? null,
    threats: [] as { source: string; description: string; date: string; severity: string }[],
    sources,
    riskScore,
    severity: scoreToSeverity(riskScore),
  };
}
