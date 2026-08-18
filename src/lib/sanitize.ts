// ============================================
// XEROVA — Input Sanitization & SSRF Prevention
// ============================================

import { detectSearchType } from "./utils";

// Private / reserved IP ranges to block (SSRF prevention)
const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^224\./,
  /^240\./,
  /^255\.255\.255\.255$/,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
  /^localhost$/i,
];

/**
 * Check if an IP address is private/reserved (SSRF prevention).
 */
export function isPrivateIP(ip: string): boolean {
  return PRIVATE_RANGES.some((re) => re.test(ip.trim()));
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
        throw new Error("Private/reserved IP addresses are not allowed");
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
        !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(
          query
        )
      ) {
        throw new Error("Invalid domain format");
      }
      if (
        query === "localhost" ||
        query.endsWith(".local") ||
        query.endsWith(".internal")
      ) {
        throw new Error("Internal/local domains are not allowed");
      }
      break;

    case "hash":
      if (!/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(query)) {
        throw new Error("Invalid hash format (must be MD5, SHA-1, or SHA-256)");
      }
      break;

    case "url": {
      try {
        const parsed = new URL(query);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Only HTTP and HTTPS URLs are allowed");
        }
        const hostname = parsed.hostname;
        if (
          hostname === "localhost" ||
          isPrivateIP(hostname) ||
          hostname.endsWith(".local")
        ) {
          throw new Error("URLs pointing to internal/private addresses are not allowed");
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes("not allowed")) throw e;
        throw new Error("Invalid URL format");
      }
      break;
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
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 1) return "critical";
  return "info";
}
