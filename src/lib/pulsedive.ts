// ============================================================
// XEROVA — Pulsedive Threat Intelligence Client
// API documentation & features:
// - Indicator Lookup (IP, Domain, URL, Hash/Artifact): /api/info.php?indicator={indicator}&key={key}
// - Threat Intelligence (Actor, Malware family): /api/info.php?threat={threat}&key={key}
// - Feed & Threat Exploration: /api/explore.php?q={query}&limit={limit}&key={key}
// ============================================================

import type { PulsediveData, PulsediveThreat, PulsediveFeed } from "@/types";

const PULSEDIVE_BASE = "https://pulsedive.com/api";

export function getPulsediveKey(): string {
  return process.env.PULSEDIVE_API_KEY || "";
}

// In-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60_000; // 5 minutes

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCache(key: string, data: unknown, ttl = CACHE_TTL) {
  if (cache.size > 1000) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

async function safeFetch(url: string, timeoutMs = 12_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "XEROVA-Cybersecurity-Intelligence/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function calculatePulsediveRiskScore(risk: string): number {
  switch (risk?.toLowerCase()) {
    case "critical":
      return 95;
    case "high":
      return 80;
    case "medium":
      return 50;
    case "low":
      return 25;
    default:
      return 0;
  }
}

/**
 * Look up an indicator (IP, Domain, URL, or Hash artifact) in Pulsedive
 */
export async function pulsediveLookup(indicator: string): Promise<PulsediveData | null> {
  const key = getPulsediveKey();
  if (!key) return null;

  const clean = indicator.trim();
  if (!clean) return null;

  const cacheKey = `pulsedive:indicator:${clean}`;
  const cached = getCached<PulsediveData>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${PULSEDIVE_BASE}/info.php?indicator=${encodeURIComponent(clean)}&key=${encodeURIComponent(key)}`;
    const res = await safeFetch(url);

    if (!res.ok) {
      if (res.status === 404) return null;
      console.warn(`[Pulsedive] Query failed with status ${res.status} for ${clean}`);
      return null;
    }

    const json = await res.json();
    if (json?.error) {
      // e.g. "Indicator not found."
      return null;
    }

    const rawThreats = Array.isArray(json.threats) ? json.threats : [];
    const threats: PulsediveThreat[] = rawThreats.map((t: Record<string, unknown>) => ({
      tid: Number(t.tid) || 0,
      name: String(t.name || ""),
      category: t.category ? String(t.category) : undefined,
      risk: t.risk ? String(t.risk) : undefined,
      stamp_linked: t.stamp_linked ? String(t.stamp_linked) : undefined,
    }));

    const rawFeeds = Array.isArray(json.feeds) ? json.feeds : [];
    const feeds: PulsediveFeed[] = rawFeeds.map((f: Record<string, unknown>) => ({
      fid: Number(f.fid) || 0,
      name: String(f.name || ""),
      category: f.category ? String(f.category) : undefined,
      organization: f.organization ? String(f.organization) : undefined,
    }));

    const risk = (json.risk?.toLowerCase() || "unknown") as PulsediveData["risk"];
    const riskScore = calculatePulsediveRiskScore(risk);

    const result: PulsediveData = {
      iid: Number(json.iid) || 0,
      indicator: String(json.indicator || clean),
      type: String(json.type || "unknown"),
      risk,
      riskScore,
      riskRecommended: json.risk_recommended ? String(json.risk_recommended) : undefined,
      retired: Boolean(json.retired),
      threats,
      feeds,
      stampAdded: json.stamp_added ? String(json.stamp_added) : undefined,
      stampUpdated: json.stamp_updated ? String(json.stamp_updated) : undefined,
      stampSeen: json.stamp_seen ? String(json.stamp_seen) : undefined,
      properties: json.properties || undefined,
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[Pulsedive] Lookup error for ${clean}:`, (error as Error).message);
    return null;
  }
}

/**
 * Look up a threat actor or malware family in Pulsedive
 */
export async function pulsediveThreatLookup(threatNameOrId: string | number): Promise<Record<string, unknown> | null> {
  const key = getPulsediveKey();
  if (!key) return null;

  const target = String(threatNameOrId).trim();
  const cacheKey = `pulsedive:threat:${target}`;
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  try {
    const isId = /^\d+$/.test(target);
    const param = isId ? `tid=${encodeURIComponent(target)}` : `threat=${encodeURIComponent(target)}`;
    const url = `${PULSEDIVE_BASE}/info.php?${param}&key=${encodeURIComponent(key)}`;
    const res = await safeFetch(url);

    if (!res.ok) return null;
    const json = await res.json();
    if (json?.error) return null;

    setCache(cacheKey, json);
    return json;
  } catch (error) {
    console.error(`[Pulsedive] Threat lookup error for ${target}:`, (error as Error).message);
    return null;
  }
}

/**
 * Explore Pulsedive threat feeds or live indicators matching a query
 */
export async function pulsediveExplore(query: string, limit = 10): Promise<Array<Record<string, unknown>>> {
  const key = getPulsediveKey();
  if (!key) return [];

  const cleanQuery = query.trim();
  const cacheKey = `pulsedive:explore:${cleanQuery}:${limit}`;
  const cached = getCached<Array<Record<string, unknown>>>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${PULSEDIVE_BASE}/explore.php?q=${encodeURIComponent(cleanQuery)}&limit=${limit}&key=${encodeURIComponent(key)}`;
    const res = await safeFetch(url);

    if (!res.ok) return [];
    const json = await res.json();
    const results = Array.isArray(json?.results) ? json.results : [];

    setCache(cacheKey, results, 10 * 60_000); // 10 min cache
    return results;
  } catch (error) {
    console.error(`[Pulsedive] Explore error for ${cleanQuery}:`, (error as Error).message);
    return [];
  }
}
