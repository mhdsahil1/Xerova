// ============================================
// XEROVA — Input Sanitization & SSRF Prevention
// ============================================

import { detectSearchType } from "./utils";

/**
 * Escape special regex characters in a user-provided search string
 * to prevent ReDoS (Regular Expression Denial of Service) in MongoDB $regex queries.
 */
export function escapeRegex(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Blocked ports for outbound URL analysis to prevent internal service probing
const BLOCKED_PORTS = new Set([
  20, 21, 22, 23, 25, 53, 69, 110, 111, 119, 123, 135, 137, 138, 139, 143,
  161, 389, 445, 514, 636, 1433, 1521, 2049, 2375, 2376, 2379, 3306, 3389,
  5432, 5900, 6379, 9200, 10250, 11211, 27017,
]);

// Internal and metadata domain suffix patterns
const INTERNAL_DOMAIN_PATTERNS = [
  /^localhost$/i,
  /\.localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /\.corp$/i,
  /\.lan$/i,
  /\.home$/i,
  /\.test$/i,
  /\.example$/i,
  /\.invalid$/i,
  /^metadata\.google\.internal$/i,
  /^metadata\.goog$/i,
  /^instance-data$/i,
];

/**
 * Parse an IPv4 string (dotted-decimal, decimal integer, hex, or octal) into a 32-bit unsigned integer.
 * Returns null if not a parseable IPv4 address.
 */
function parseIPv4ToNumber(ip: string): number | null {
  const clean = ip.trim();

  // Decimal integer format: e.g. "2130706433"
  if (/^\d+$/.test(clean)) {
    const num = Number(clean);
    if (num >= 0 && num <= 0xffffffff) {
      return num >>> 0;
    }
    return null;
  }

  // Hexadecimal format: e.g. "0x7f000001"
  if (/^0x[0-9a-f]+$/i.test(clean)) {
    const num = parseInt(clean, 16);
    if (num >= 0 && num <= 0xffffffff) {
      return num >>> 0;
    }
    return null;
  }

  // Dotted notation: can have 1 to 4 parts (supports octal/hex per segment, e.g. 127.1, 0177.0.0.1)
  const parts = clean.split(".");
  if (parts.length > 4 || parts.length === 0) return null;

  const parsedParts: number[] = [];
  for (const part of parts) {
    if (!part) return null;
    let val: number;
    if (/^0x[0-9a-f]+$/i.test(part)) {
      val = parseInt(part, 16);
    } else if (/^0[0-7]+$/.test(part)) {
      val = parseInt(part, 8);
    } else if (/^\d+$/.test(part)) {
      val = parseInt(part, 10);
    } else {
      return null;
    }
    if (isNaN(val) || val < 0) return null;
    parsedParts.push(val);
  }

  // Standard a.b.c.d
  if (parsedParts.length === 4) {
    if (parsedParts.some((p) => p > 255)) return null;
    return (
      ((parsedParts[0] << 24) |
        (parsedParts[1] << 16) |
        (parsedParts[2] << 8) |
        parsedParts[3]) >>>
      0
    );
  }

  // Short forms: a.b.c (a << 24 | b << 16 | c), a.b (a << 24 | b), a
  if (parsedParts.length === 3) {
    if (parsedParts[0] > 255 || parsedParts[1] > 255 || parsedParts[2] > 65535) return null;
    return ((parsedParts[0] << 24) | (parsedParts[1] << 16) | parsedParts[2]) >>> 0;
  }
  if (parsedParts.length === 2) {
    if (parsedParts[0] > 255 || parsedParts[1] > 16777215) return null;
    return ((parsedParts[0] << 24) | parsedParts[1]) >>> 0;
  }
  if (parsedParts.length === 1) {
    if (parsedParts[0] > 0xffffffff) return null;
    return parsedParts[0] >>> 0;
  }

  return null;
}

/**
 * Check if a 32-bit unsigned integer represents an IPv4 address in a private or reserved range.
 */
function isPrivateIPv4Number(num: number): boolean {
  // 0.0.0.0/8 (Current network)
  if ((num & 0xff000000) === 0x00000000) return true;
  // 10.0.0.0/8 (Private)
  if ((num & 0xff000000) === 0x0a000000) return true;
  // 100.64.0.0/10 (Shared Address Space / CGNAT)
  if ((num & 0xffc00000) === 0x64400000) return true;
  // 127.0.0.0/8 (Loopback)
  if ((num & 0xff000000) === 0x7f000000) return true;
  // 169.254.0.0/16 (Link-Local / Cloud Metadata)
  if ((num & 0xffff0000) === 0xa9fe0000) return true;
  // 172.16.0.0/12 (Private)
  if ((num & 0xfff00000) === 0xac100000) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if ((num & 0xffffff00) === 0xc0000000) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if ((num & 0xffffff00) === 0xc0000200) return true;
  // 192.168.0.0/16 (Private)
  if ((num & 0xffff0000) === 0xc0a80000) return true;
  // 198.18.0.0/15 (Benchmarking)
  if ((num & 0xfffe0000) === 0xc6120000) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if ((num & 0xffffff00) === 0xc6336400) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if ((num & 0xffffff00) === 0xcb007100) return true;
  // 224.0.0.0/4 (Multicast)
  if ((num & 0xf0000000) === 0xe0000000) return true;
  // 240.0.0.0/4 (Reserved / Future Use)
  if ((num & 0xf0000000) === 0xf0000000) return true;
  // 255.255.255.255 (Broadcast)
  if (num === 0xffffffff) return true;

  return false;
}

/**
 * Check if an IPv6 address string is in a private, loopback, or reserved range.
 */
function isPrivateIPv6(ip: string): boolean {
  const clean = ip.trim().toLowerCase().replace(/^\[|\]$/g, "");

  // Unspecified & Loopback
  if (clean === "::" || clean === "::1" || /^0*(:0*)*:?1$/.test(clean)) return true;

  // IPv4-mapped IPv6: ::ffff:127.0.0.1 or ::ffff:7f00:1
  if (clean.startsWith("::ffff:") || clean.startsWith("0:0:0:0:0:ffff:")) {
    const mappedPart = clean.replace(/^(::ffff:|0:0:0:0:0:ffff:)/i, "");
    if (mappedPart.includes(".")) {
      const parsedNum = parseIPv4ToNumber(mappedPart);
      if (parsedNum !== null && isPrivateIPv4Number(parsedNum)) return true;
    } else {
      return true; // Conservative block on mapped representations
    }
  }

  // Unique Local Address (fc00::/7 -> fc00:: through fdff::)
  if (/^f[cd][0-9a-f]{2}:/i.test(clean) || clean.startsWith("fc") || clean.startsWith("fd")) {
    return true;
  }

  // Link-Local (fe80::/10)
  if (/^fe[89ab][0-9a-f]:/i.test(clean) || clean.startsWith("fe80:")) {
    return true;
  }

  // Discard Prefix (100::/64) & Documentation (2001:db8::/32)
  if (clean.startsWith("100:") || clean.startsWith("2001:db8:") || clean.startsWith("2001:0db8:")) {
    return true;
  }

  return false;
}

/**
 * Check if an IP address or hostname is private/reserved/internal (SSRF prevention).
 */
export function isPrivateIP(target: string): boolean {
  if (!target || typeof target !== "string") return true;
  const clean = target.trim().toLowerCase().replace(/^\[|\]$/g, "");

  // Hostname string matching
  if (clean === "localhost" || INTERNAL_DOMAIN_PATTERNS.some((p) => p.test(clean))) {
    return true;
  }

  // Check wildcards like *.nip.io, *.sslip.io that encode private IPs
  const wildcardMatch = clean.match(/(?:^|\.)(?:127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+)(?:\.|$)/);
  if (wildcardMatch) {
    return true;
  }

  // Try parsing as IPv4 (standard, octal, hex, dword)
  const ipv4Num = parseIPv4ToNumber(clean);
  if (ipv4Num !== null) {
    return isPrivateIPv4Number(ipv4Num);
  }

  // Try parsing as IPv6
  if (clean.includes(":") && isPrivateIPv6(clean)) {
    return true;
  }

  return false;
}

/**
 * Validates a URL thoroughly against SSRF, dangerous protocols, blocked ports,
 * credentials, and excessive lengths.
 */
export function validateAndSanitizeURL(rawUrl: string): {
  safe: boolean;
  url?: string;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, error: "URL is required and must be a string." };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return { safe: false, error: "URL cannot be empty." };
  }

  if (trimmed.length > 2048) {
    return { safe: false, error: "URL exceeds maximum permitted length of 2048 characters." };
  }

  // Check if an explicit scheme is present (e.g. file:, gopher:, ftp:, javascript:, data:)
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      return {
        safe: false,
        error: `Protocol '${scheme}:' is not permitted. Only HTTP and HTTPS are allowed.`,
      };
    }
  }

  // Normalize scheme if missing (e.g. "example.com/path" -> "https://example.com/path")
  const normalized = !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { safe: false, error: "Invalid URL format." };
  }

  // 1. Enforce HTTP / HTTPS protocol only
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      safe: false,
      error: `Protocol '${parsed.protocol}' is not allowed. Only HTTP and HTTPS are permitted.`,
    };
  }

  // 2. Disallow embedded credentials/userinfo (e.g. http://user:pass@host)
  if (parsed.username || parsed.password) {
    return { safe: false, error: "URLs containing user credentials are not permitted." };
  }

  // 3. Validate port
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      return { safe: false, error: "Invalid port number in URL." };
    }
    if (BLOCKED_PORTS.has(portNum)) {
      return {
        safe: false,
        error: `Port ${portNum} is restricted for security reasons.`,
      };
    }
  }

  // 4. Validate hostname
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname.length === 0) {
    return { safe: false, error: "URL must contain a valid hostname." };
  }

  if (isPrivateIP(hostname)) {
    return {
      safe: false,
      error: "URLs resolving or pointing to private, loopback, internal, or cloud metadata addresses are forbidden.",
    };
  }

  return { safe: true, url: parsed.toString() };
}

/**
 * Sanitize and validate a threat lookup query.
 * Returns cleaned query + detected type, or throws on invalid input.
 */
export function sanitizeQuery(
  rawQuery: string,
  requestedType?: string
): { query: string; type: "ip" | "domain" | "hash" | "url" | "cve" } {
  if (!rawQuery || typeof rawQuery !== "string") {
    throw new Error("Query is required");
  }

  const query = rawQuery.trim().slice(0, 500);

  if (query.length === 0) {
    throw new Error("Query cannot be empty");
  }

  // Detect type
  const type =
    requestedType && ["ip", "domain", "hash", "url", "cve"].includes(requestedType)
      ? (requestedType as "ip" | "domain" | "hash" | "url" | "cve")
      : detectSearchType(query);

  // Type-specific validation
  switch (type) {
    case "ip":
      if (isPrivateIP(query)) {
        throw new Error("Private, loopback, or reserved IP addresses are not allowed");
      }
      if (
        !/^(\d{1,3}\.){3}\d{1,3}$/.test(query) &&
        !/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(query)
      ) {
        throw new Error("Invalid IP address format");
      }
      break;

    case "domain":
      if (
        !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(query)
      ) {
        throw new Error("Invalid domain format");
      }
      if (isPrivateIP(query)) {
        throw new Error("Internal or local domain names are not allowed");
      }
      break;

    case "hash":
      if (!/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(query)) {
        throw new Error("Invalid hash format (must be MD5, SHA-1, or SHA-256)");
      }
      break;

    case "url": {
      const urlValidation = validateAndSanitizeURL(query);
      if (!urlValidation.safe || !urlValidation.url) {
        throw new Error(urlValidation.error || "Invalid URL format");
      }
      return { query: urlValidation.url, type };
    }

    case "cve":
      if (!/^CVE-\d{4}-\d{4,}$/i.test(query)) {
        throw new Error("Invalid CVE ID format (e.g., CVE-2024-3094)");
      }
      break;
  }

  return { query, type };
}

/**
 * Safely compute a severity level from a numeric risk score.
 */
export function scoreToSeverity(
  score: number
): "critical" | "high" | "medium" | "low" | "info" {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  if (score >= 15) return "low";
  return "info";
}

