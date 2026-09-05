// ============================================
// XEROVA — Safe URL Unshortener & Redirect Resolver
// ============================================
// Follows redirect chains for shortened and vanity URLs (bit.ly, qrco.de, etc.)
// with multi-layered SSRF protection, DNS rebinding prevention, hop limiters,
// and dead-shortlink detection.

import dns from "dns/promises";
import { validateAndSanitizeURL, isPrivateIP } from "./sanitize";

export const KNOWN_SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "tinyurl.com",
  "qrco.de",
  "goo.gl",
  "t.co",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "tiny.cc",
  "lnkd.in",
  "trib.al",
  "s.id",
  "v.gd",
  "linktr.ee",
  "qr1.at",
  "me-qr.com",
  "scanova.io",
  "flowcode.com",
  "qr-code.me",
  "q-r.to",
  "qrplanet.com",
  "page.link",
]);

export function isKnownShortener(hostname: string): boolean {
  const cleanHost = (hostname || "").toLowerCase().trim();
  for (const domain of KNOWN_SHORTENER_DOMAINS) {
    if (cleanHost === domain || cleanHost.endsWith("." + domain)) {
      return true;
    }
  }
  return false;
}

export interface ResolutionResult {
  resolved: boolean;
  finalUrl: string;
  redirectionChain: string[];
  hopCount: number;
  isKnownShortener: boolean;
  blockedSSRF?: boolean;
  error?: string;
  statusCode?: number;
}

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const DEFAULT_TIMEOUT_MS = 5000;
const USER_AGENT = "Mozilla/5.0 (compatible; XEROVA-AntiQuishing/1.0; +https://xerova.io)";

/**
 * Validates whether a hostname resolves to any private/loopback/internal IP (DNS rebinding check).
 */
async function verifyDNS(hostname: string): Promise<{ safe: boolean; ip?: string; error?: string }> {
  try {
    // If hostname is already an IP, test directly
    if (isPrivateIP(hostname)) {
      return { safe: false, ip: hostname, error: "Hostname is a reserved/private IP address." };
    }

    const records = await dns.lookup(hostname, { all: true });
    for (const record of records) {
      if (isPrivateIP(record.address)) {
        return {
          safe: false,
          ip: record.address,
          error: `Resolved address (${record.address}) is a private/internal IP (SSRF blocked).`,
        };
      }
    }
    return { safe: true, ip: records[0]?.address };
  } catch (err) {
    // DNS resolution failure
    return { safe: false, error: (err as Error).message || "DNS lookup failed." };
  }
}

/**
 * Resolves a URL to its final destination by manually following HTTP redirects.
 * Validates each step against SSRF, blocked ports, and DNS rebinding.
 */
export async function resolveRedirects(
  initialUrl: string,
  maxHops = 5,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ResolutionResult> {
  // Step 1: Sanitize and validate starting URL
  const initialSanitized = validateAndSanitizeURL(initialUrl);
  if (!initialSanitized.safe || !initialSanitized.url) {
    return {
      resolved: false,
      finalUrl: initialUrl,
      redirectionChain: [initialUrl],
      hopCount: 0,
      isKnownShortener: false,
      blockedSSRF: true,
      error: initialSanitized.error || "Prohibited or invalid starting URL.",
    };
  }

  let currentUrl = initialSanitized.url;
  const chain: string[] = [currentUrl];
  const visited = new Set<string>([currentUrl]);
  const initialParsed = new URL(currentUrl);
  const initialIsShortener = isKnownShortener(initialParsed.hostname);

  let hop = 0;
  let lastStatusCode: number | undefined;

  while (hop < maxHops) {
    const parsed = new URL(currentUrl);

    // Enforce protocol restriction
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        resolved: false,
        finalUrl: currentUrl,
        redirectionChain: chain,
        hopCount: hop,
        isKnownShortener: initialIsShortener,
        blockedSSRF: true,
        error: `Restricted protocol encountered (${parsed.protocol}) during redirect chain.`,
      };
    }

    // SSRF & DNS Rebinding check
    const dnsCheck = await verifyDNS(parsed.hostname);
    if (!dnsCheck.safe) {
      const isShortener = isKnownShortener(parsed.hostname);
      return {
        resolved: false,
        finalUrl: currentUrl,
        redirectionChain: chain,
        hopCount: hop,
        isKnownShortener: isShortener || initialIsShortener,
        blockedSSRF: dnsCheck.error?.includes("private"),
        error: dnsCheck.error,
      };
    }

    // Attempt single-hop resolution without auto-redirects
    try {
      let res: Response;
      const headers = { "User-Agent": USER_AGENT, Accept: "*/*" };

      // Try HEAD request first for speed
      try {
        res = await fetch(currentUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
          headers,
        });
      } catch {
        // Fallback to GET if HEAD is rejected or times out
        res = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
          headers,
        });
      }

      lastStatusCode = res.status;

      // Check if redirect status code
      if (REDIRECT_STATUS_CODES.has(res.status)) {
        const location = res.headers.get("location");
        if (!location) {
          // No location header on redirect status
          break;
        }

        let nextUrl: string;
        try {
          nextUrl = new URL(location, currentUrl).toString();
        } catch {
          return {
            resolved: false,
            finalUrl: currentUrl,
            redirectionChain: chain,
            hopCount: hop,
            isKnownShortener: initialIsShortener,
            error: `Malformed redirect location header: ${location}`,
          };
        }

        // Validate the next URL before following
        const nextSanitized = validateAndSanitizeURL(nextUrl);
        if (!nextSanitized.safe || !nextSanitized.url) {
          return {
            resolved: false,
            finalUrl: currentUrl,
            redirectionChain: chain,
            hopCount: hop,
            isKnownShortener: initialIsShortener,
            blockedSSRF: true,
            error: `Redirect location rejected by security policy: ${nextSanitized.error}`,
          };
        }

        // Circular redirect loop check
        if (visited.has(nextSanitized.url)) {
          return {
            resolved: true,
            finalUrl: nextSanitized.url,
            redirectionChain: [...chain, nextSanitized.url],
            hopCount: hop + 1,
            isKnownShortener: initialIsShortener,
            error: "Circular redirect loop detected.",
          };
        }

        currentUrl = nextSanitized.url;
        chain.push(currentUrl);
        visited.add(currentUrl);
        hop++;
        continue;
      }

      // If status >= 400 on a known shortener, mark as dead shortlink
      if (res.status >= 400 && initialIsShortener) {
        return {
          resolved: false,
          finalUrl: currentUrl,
          redirectionChain: chain,
          hopCount: hop,
          isKnownShortener: true,
          statusCode: res.status,
          error: `Unresolvable redirect destination / Dead shortlink (HTTP ${res.status}).`,
        };
      }

      // Reached final non-redirect response
      break;
    } catch (fetchErr) {
      const errMessage = (fetchErr as Error)?.message || "Network request failed";
      // Known shortener failure
      if (initialIsShortener) {
        return {
          resolved: false,
          finalUrl: currentUrl,
          redirectionChain: chain,
          hopCount: hop,
          isKnownShortener: true,
          error: `Unresolvable redirect destination / Dead shortlink: ${errMessage}`,
        };
      }

      return {
        resolved: false,
        finalUrl: currentUrl,
        redirectionChain: chain,
        hopCount: hop,
        isKnownShortener: false,
        error: `Could not follow redirects (${errMessage}); using target as given.`,
      };
    }
  }

  return {
    resolved: true,
    finalUrl: currentUrl,
    redirectionChain: chain,
    hopCount: chain.length - 1,
    isKnownShortener: initialIsShortener,
    statusCode: lastStatusCode,
  };
}
