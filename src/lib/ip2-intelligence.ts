// ============================================
// XEROVA — IP2Location / IP2WHOIS Intelligence
// ============================================
// Companion integration layer for the existing threat API client.
// Keeps the central threat-apis module stable while adding IP2 enrichment.

import {
  mergedIPLookup,
  mergedDomainLookup,
  mergedURLLookup,
} from "./threat-apis";
import type {
  IP2LocationData,
  IP2WhoisData,
  HostedDomainsData,
} from "../types";

const FETCH_TIMEOUT = 12_000;
const CACHE_TTL = 5 * 60_000;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

async function safeFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timer);
  }
}

export const getIP2LocationKey = () => process.env.IP2LOCATION_API_KEY || "";
export const getIP2WhoisKey = () => process.env.IP2WHOIS_API_KEY || "";

export async function ip2LocationLookup(ip: string): Promise<IP2LocationData | null> {
  const key = getIP2LocationKey();
  if (!key) return null;

  const cacheKey = `ip2location:${ip}`;
  const cached = getCached<IP2LocationData>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL("https://api.ip2location.io/");
    url.searchParams.set("key", key);
    url.searchParams.set("ip", ip);
    url.searchParams.set("format", "json");

    const res = await safeFetch(url.toString());
    if (!res.ok) return null;

    const d = await res.json();
    const result: IP2LocationData = {
      ip: String(d?.ip || ip),
      countryCode: String(d?.country_code || ""),
      countryName: String(d?.country_name || ""),
      regionName: String(d?.region_name || ""),
      cityName: String(d?.city_name || ""),
      latitude: typeof d?.latitude === "number" ? d.latitude : Number(d?.latitude || 0),
      longitude: typeof d?.longitude === "number" ? d.longitude : Number(d?.longitude || 0),
      zipCode: String(d?.zip_code || ""),
      timeZone: String(d?.time_zone || ""),
      asn: String(d?.asn || ""),
      asName: String(d?.as || d?.as_info?.as_name || ""),
      isProxy: Boolean(d?.is_proxy),
    };

    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[IP2Location] Lookup failed:", (e as Error).message);
    return null;
  }
}

function normalizeContact(value: Record<string, unknown> | undefined) {
  if (!value) return undefined;
  return {
    name: value.name ? String(value.name) : undefined,
    organization: value.organization ? String(value.organization) : undefined,
    streetAddress: value.street_address ? String(value.street_address) : undefined,
    city: value.city ? String(value.city) : undefined,
    region: value.region ? String(value.region) : undefined,
    zipCode: value.zip_code ? String(value.zip_code) : undefined,
    country: value.country ? String(value.country) : undefined,
    phone: value.phone ? String(value.phone) : undefined,
    fax: value.fax ? String(value.fax) : undefined,
    email: value.email ? String(value.email) : undefined,
  };
}

export async function ip2WhoisLookup(domain: string): Promise<IP2WhoisData | null> {
  const key = getIP2WhoisKey();
  if (!key) return null;

  const normalizedDomain = domain.trim().toLowerCase();
  const cacheKey = `ip2whois:${normalizedDomain}`;
  const cached = getCached<IP2WhoisData>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL("https://api.ip2whois.com/v2");
    url.searchParams.set("key", key);
    url.searchParams.set("domain", normalizedDomain);

    const res = await safeFetch(url.toString());
    if (!res.ok) return null;

    const d = await res.json();
    if (!d?.domain) return null;

    const result: IP2WhoisData = {
      domain: String(d.domain),
      domainId: d.domain_id ? String(d.domain_id) : undefined,
      status: d.status ? String(d.status) : undefined,
      createDate: d.create_date ? String(d.create_date) : undefined,
      updateDate: d.update_date ? String(d.update_date) : undefined,
      expireDate: d.expire_date ? String(d.expire_date) : undefined,
      domainAge: typeof d.domain_age === "number" ? d.domain_age : Number(d.domain_age || 0),
      whoisServer: d.whois_server ? String(d.whois_server) : undefined,
      registrar: d.registrar
        ? {
            ianaId: d.registrar.iana_id ? String(d.registrar.iana_id) : undefined,
            name: d.registrar.name ? String(d.registrar.name) : undefined,
            url: d.registrar.url ? String(d.registrar.url) : undefined,
          }
        : undefined,
      registrant: normalizeContact(d.registrant),
      admin: normalizeContact(d.admin),
      tech: normalizeContact(d.tech),
      billing: normalizeContact(d.billing),
      nameservers: Array.isArray(d.nameservers)
        ? d.nameservers.map((ns: unknown) => String(ns)).filter(Boolean)
        : [],
    };

    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[IP2WHOIS] Domain lookup failed:", (e as Error).message);
    return null;
  }
}

export async function ip2WhoisHostedDomains(
  ip: string,
  page = 1
): Promise<HostedDomainsData | null> {
  const key = getIP2WhoisKey();
  if (!key) return null;

  const cacheKey = `ip2whois:hosted:${ip}:${page}`;
  const cached = getCached<HostedDomainsData>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL("https://domains.ip2whois.com/domains");
    url.searchParams.set("key", key);
    url.searchParams.set("ip", ip);
    url.searchParams.set("page", String(Math.max(1, page)));

    const res = await safeFetch(url.toString());
    if (!res.ok) return null;

    const d = await res.json();
    const domains = Array.isArray(d?.domains)
      ? d.domains.map((domain: unknown) => String(domain)).filter(Boolean)
      : [];

    const result: HostedDomainsData = {
      ip,
      totalDomains: Number(d?.total_domains ?? d?.totalDomains ?? domains.length),
      page: Number(d?.page ?? page),
      perPage: Number(d?.per_page ?? d?.perPage ?? domains.length),
      totalPages: Number(d?.total_pages ?? d?.totalPages ?? 1),
      domains,
    };

    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error("[IP2WHOIS] Hosted-domain lookup failed:", (e as Error).message);
    return null;
  }
}

function addSource(sources: string[] | undefined, source: string) {
  return Array.from(new Set([...(sources || []), source]));
}

export async function enrichedIPLookup(ip: string) {
  const [base, location, hostedDomains] = await Promise.all([
    mergedIPLookup(ip),
    ip2LocationLookup(ip),
    ip2WhoisHostedDomains(ip),
  ]);

  const riskSignals = [base.riskScore || 0];
  if (location?.isProxy) riskSignals.push(35);

  return {
    ...base,
    country: location?.countryName || base.country,
    countryCode: location?.countryCode || base.countryCode,
    city: location?.cityName || base.city,
    region: location?.regionName || "",
    latitude: location?.latitude,
    longitude: location?.longitude,
    zipCode: location?.zipCode,
    timeZone: location?.timeZone,
    org: location?.asName || base.org,
    asn: location?.asn ? `AS${location.asn}` : base.asn,
    isProxy: base.isProxy || Boolean(location?.isProxy),
    ip2location: location,
    hostedDomains,
    sources: addSource(
      addSource(base.sources, location ? "IP2Location" : ""),
      hostedDomains ? "IP2WHOIS" : ""
    ).filter(Boolean),
    riskScore: Math.max(...riskSignals),
  };
}

export async function enrichedDomainLookup(domain: string) {
  const [base, whois] = await Promise.all([
    mergedDomainLookup(domain),
    ip2WhoisLookup(domain),
  ]);

  const domainAge = whois?.domainAge ?? null;
  const nrdRisk = typeof domainAge === "number" && domainAge < 30
    ? domainAge < 7 ? 75 : 55
    : 0;
  const riskScore = Math.max(base.riskScore || 0, nrdRisk);

  const threats = [...(base.threats || [])];
  if (typeof domainAge === "number" && domainAge < 30) {
    threats.push({
      source: "IP2WHOIS",
      description: `Newly registered domain: ${domainAge} day${domainAge === 1 ? "" : "s"} old`,
      date: new Date().toISOString().slice(0, 10),
      severity: domainAge < 7 ? "high" : "medium",
    });
  }

  return {
    ...base,
    registrar: whois?.registrar?.name || base.registrar,
    registeredDate: whois?.createDate?.slice(0, 10) || base.registeredDate,
    expiryDate: whois?.expireDate?.slice(0, 10) || base.expiryDate,
    nameservers: whois?.nameservers?.length ? whois.nameservers : base.nameservers,
    status: whois?.status ? [whois.status] : base.status,
    country: whois?.registrant?.country || base.country,
    domainAge,
    ip2whois: whois,
    threats,
    sources: addSource(base.sources, whois ? "IP2WHOIS" : "" ).filter(Boolean),
    riskScore,
  };
}

export async function enrichedURLLookup(url: string) {
  const base = await mergedURLLookup(url);
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    return base;
  }

  if (!domain) return base;
  const whois = await ip2WhoisLookup(domain);
  if (!whois) return base;

  const age = whois.domainAge ?? null;
  const nrdRisk = typeof age === "number" && age < 30 ? (age < 7 ? 75 : 55) : 0;
  const riskScore = Math.max(base.riskScore || 0, nrdRisk);
  const riskFactors = [...(base.riskFactors || [])];

  if (typeof age === "number" && age < 30) {
    riskFactors.push({
      source: "IP2WHOIS",
      category: "Domain Age",
      reason: `Newly registered domain (${age} days old)`,
      severity: age < 7 ? "HIGH" : "MEDIUM",
      scoreContribution: nrdRisk,
    });
  }

  return {
    ...base,
    riskScore,
    sources: addSource(base.sources, "IP2WHOIS"),
    threatIntelligence: {
      ...base.threatIntelligence,
      ip2whois: whois,
    },
    domainCharacteristics: {
      ...base.domainCharacteristics,
      domainAge: age,
    },
    riskFactors,
  };
}
