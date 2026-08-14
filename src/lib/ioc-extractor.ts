// ============================================
// XEROVA — IOC Extractor Utility
// ============================================

export type IOCType = "ip" | "domain" | "hash" | "url" | "cve" | "email";

export interface ExtractedIOC {
  type: IOCType;
  value: string;
  context?: string;
}

// Private & reserved IP range check
const PRIVATE_IP_REGEX = [
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
  /^localhost$/i,
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_REGEX.some((re) => re.test(ip.trim()));
}

// Common non-domain words or common extensions to exclude from domain extractor
const IGNORED_DOMAINS = new Set([
  "example.com",
  "localhost",
  "domain.com",
  "schema.org",
  "w3.org",
  "github.com",
  "npmjs.com",
]);

const EXCLUDED_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".json",
  ".pdf",
  ".doc",
  ".docx",
  ".zip",
  ".tar",
  ".gz",
  ".html",
];

/**
 * Extract Indicators of Compromise (IOCs) from unstructured text.
 */
export function extractIOCs(text: string): ExtractedIOC[] {
  if (!text || typeof text !== "string") return [];

  const results: ExtractedIOC[] = [];
  const seen = new Set<string>();

  const addIOC = (type: IOCType, value: string, context?: string) => {
    const key = `${type}:${value.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ type, value, context });
    }
  };

  // 1. Extract CVEs (e.g. CVE-2024-3094, CVE-2021-44228)
  const cveRegex = /\bCVE-\d{4}-\d{4,7}\b/gi;
  let match: RegExpExecArray | null;
  while ((match = cveRegex.exec(text)) !== null) {
    addIOC("cve", match[0].toUpperCase());
  }

  // 2. Extract URLs (http:// or https://)
  const urlRegex = /\bhttps?:\/\/[^\s<>"'{}|\^~\[\]`]+/gi;
  while ((match = urlRegex.exec(text)) !== null) {
    let cleanUrl = match[0].replace(/[\.,;\)]+$/, "");
    try {
      const parsed = new URL(cleanUrl);
      if (
        parsed.hostname !== "localhost" &&
        !isPrivateIP(parsed.hostname)
      ) {
        addIOC("url", cleanUrl);
      }
    } catch {
      // Ignore malformed URL
    }
  }

  // 3. Extract Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    addIOC("email", match[0].toLowerCase());
  }

  // 4. Extract IPv4 & IPv6
  const ipv4Regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  while ((match = ipv4Regex.exec(text)) !== null) {
    const ip = match[0];
    const parts = ip.split(".").map(Number);
    if (parts.every((p) => p >= 0 && p <= 255) && !isPrivateIP(ip)) {
      addIOC("ip", ip);
    }
  }

  const ipv6Regex = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g;
  while ((match = ipv6Regex.exec(text)) !== null) {
    const ip = match[0];
    if (!isPrivateIP(ip)) {
      addIOC("ip", ip);
    }
  }

  // 5. Extract File Hashes (MD5 = 32, SHA1 = 40, SHA256 = 64)
  const sha256Regex = /\b[a-fA-F0-9]{64}\b/g;
  while ((match = sha256Regex.exec(text)) !== null) {
    addIOC("hash", match[0].toLowerCase(), "SHA-256");
  }

  const sha1Regex = /\b[a-fA-F0-9]{40}\b/g;
  while ((match = sha1Regex.exec(text)) !== null) {
    addIOC("hash", match[0].toLowerCase(), "SHA-1");
  }

  const md5Regex = /\b[a-fA-F0-9]{32}\b/g;
  while ((match = md5Regex.exec(text)) !== null) {
    addIOC("hash", match[0].toLowerCase(), "MD5");
  }

  // 6. Extract Domains (FQDNs)
  const domainRegex = /\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+\b/g;
  while ((match = domainRegex.exec(text)) !== null) {
    const domain = match[0].toLowerCase();
    const isExcludedExt = EXCLUDED_FILE_EXTENSIONS.some((ext) =>
      domain.endsWith(ext)
    );
    if (
      !IGNORED_DOMAINS.has(domain) &&
      !isExcludedExt &&
      !domain.endsWith(".local") &&
      !domain.endsWith(".internal") &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(domain) &&
      domain.includes(".")
    ) {
      // Check if domain is part of an already extracted URL or email
      const alreadyInUrlOrEmail = results.some(
        (r) => (r.type === "url" || r.type === "email") && r.value.includes(domain)
      );
      if (!alreadyInUrlOrEmail) {
        addIOC("domain", domain);
      }
    }
  }

  return results;
}
