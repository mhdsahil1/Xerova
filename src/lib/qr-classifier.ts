// ============================================
// XEROVA — QR Code Payload Classifier & Parsers
// ============================================
// Classifies decoded QR contents into URLs, Wi-Fi configuration schemas,
// or plain text, providing deep security inspection for each category.

import { calculateShannonEntropy } from "./url-analyzer";

export type QRPayloadType = "url" | "wifi" | "text";

export interface WifiConfigResult {
  ssid: string;
  authType: "WPA3" | "WPA2" | "WPA" | "WEP" | "nopass" | "unknown";
  password?: string;
  hidden: boolean;
  securityRating: "insecure" | "weak" | "moderate" | "strong";
  advisory: string;
  rawPayload: string;
}

export interface TextAnalysisResult {
  rawText: string;
  length: number;
  wordCount: number;
  entropy: number;
  isHighEntropy: boolean;
  suspiciousFlags: Array<{
    name: string;
    severity: "low" | "medium" | "high";
    detail: string;
  }>;
  suggestedAction: string;
}

/**
 * Classifies a raw decoded QR string into a primary type.
 */
export function classifyPayload(rawPayload: string): QRPayloadType {
  const trimmed = (rawPayload || "").trim();

  // Wi-Fi configuration schema (e.g. WIFI:S:MySSID;T:WPA;P:Password;;)
  if (/^WIFI:/i.test(trimmed)) {
    return "wifi";
  }

  // URL schemas: HTTP, HTTPS, or domain-like formats
  if (/^https?:\/\//i.test(trimmed)) {
    return "url";
  }

  // Domain-like string without protocol: e.g. example.com/path, sub.domain.org
  if (
    /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(?:\/.*)?$/i.test(
      trimmed
    )
  ) {
    return "url";
  }

  return "text";
}

/**
 * Unescapes Wi-Fi QR parameter values according to ZXing specification.
 * Special characters \;, \:, \,, \\
 */
function unescapeWifiValue(val: string): string {
  return val
    .replace(/\\;/g, ";")
    .replace(/\\:/g, ":")
    .replace(/\\,/g, ",")
    .replace(/\\\\/g, "\\");
}

/**
 * Parses a standard Wi-Fi network configuration QR payload.
 * Format: WIFI:T:<auth>;S:<ssid>;P:<password>;H:<hidden>;;
 */
export function parseWifiPayload(rawPayload: string): WifiConfigResult {
  const content = rawPayload.replace(/^WIFI:/i, "").replace(/;;?$/, "");

  // Match key-value pairs (e.g., S:MyNetwork; or P:MyPassword;)
  const parts = content.split(/(?<!\\);/);
  let ssid = "";
  let rawAuth = "unknown";
  let password = "";
  let hidden = false;

  for (const part of parts) {
    if (!part) continue;
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) continue;

    const key = part.slice(0, colonIdx).toUpperCase().trim();
    const value = unescapeWifiValue(part.slice(colonIdx + 1));

    switch (key) {
      case "S":
        ssid = value;
        break;
      case "T":
        rawAuth = value.toUpperCase();
        break;
      case "P":
        password = value;
        break;
      case "H":
        hidden = value.toLowerCase() === "true" || value === "1";
        break;
    }
  }

  // Normalize auth type
  let authType: WifiConfigResult["authType"] = "unknown";
  if (rawAuth.includes("WPA3")) authType = "WPA3";
  else if (rawAuth.includes("WPA2")) authType = "WPA2";
  else if (rawAuth === "WPA") authType = "WPA";
  else if (rawAuth === "WEP") authType = "WEP";
  else if (rawAuth === "NOPASS" || rawAuth === "NONE" || (!password && rawAuth === "unknown")) {
    authType = "nopass";
  }

  // Determine security rating & advisory
  let securityRating: WifiConfigResult["securityRating"] = "moderate";
  let advisory = "Standard Wi-Fi access configuration.";

  if (authType === "nopass") {
    securityRating = "insecure";
    advisory =
      "CRITICAL: Unencrypted Open Wi-Fi. Attackers can eavesdrop on plaintext traffic or deploy rogue Evil Twin access points.";
  } else if (authType === "WEP") {
    securityRating = "weak";
    advisory =
      "WARNING: Deprecated WEP encryption detected. WEP keys can be recovered in minutes via statistical packet analysis.";
  } else if (authType === "WPA") {
    securityRating = "weak";
    advisory =
      "NOTICE: Legacy WPA/TKIP encryption. Vulnerable to offline dictionary and key reinstallation attacks. Upgrade to WPA2/WPA3.";
  } else if (authType === "WPA3") {
    securityRating = "strong";
    advisory = "Robust WPA3-SAE encryption with forward secrecy and protected management frames.";
  } else if (authType === "WPA2") {
    securityRating = "strong";
    advisory = "Modern WPA2-PSK (AES-CCMP) encryption detected.";
  }

  return {
    ssid: ssid || "Unnamed Network",
    authType,
    password: password || undefined,
    hidden,
    securityRating,
    advisory,
    rawPayload,
  };
}

const COMMAND_INJECTION_PATTERNS = [
  { regex: /(?:powershell|cmd(?:\.exe)?|pwsh)/i, name: "Shell Execution Token" },
  { regex: /(?:curl|wget|certutil|bitsadmin)\s+[-/]/i, name: "Remote Download Command" },
  { regex: /(?:invoke-expression|iex|eval|downloadstring)/i, name: "Dynamic Execution Primitive" },
  { regex: /(?:bash\s+-i|nc\s+-e|\/bin\/(?:sh|bash))/i, name: "Reverse Shell Construct" },
  { regex: /<script[\s>]/i, name: "HTML / XSS Script Payload" },
];

const CREDENTIAL_LEAK_PATTERNS = [
  { regex: /(?:api[-_]?key|apikey|secret[-_]?key)\s*[:=]\s*['"]?[a-zA-Z0-9-_]{16,}['"]?/i, name: "API Key Exposure" },
  { regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, name: "Private Cryptographic Key" },
  { regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s;'"]{6,}['"]?/i, name: "Plaintext Credential" },
  { regex: /(?:bearer\s+eyJ[a-zA-Z0-9-_]+)/i, name: "Bearer JWT Token" },
];

/**
 * Analyzes plain-text QR payloads for entropy, hidden scripts, or sensitive credentials.
 */
export function analyzePlainTextPayload(rawText: string): TextAnalysisResult {
  const length = rawText.length;
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const entropy = calculateShannonEntropy(rawText);
  const isHighEntropy = length >= 24 && entropy > 4.5;

  const suspiciousFlags: TextAnalysisResult["suspiciousFlags"] = [];

  // Check command injections
  for (const { regex, name } of COMMAND_INJECTION_PATTERNS) {
    if (regex.test(rawText)) {
      suspiciousFlags.push({
        name,
        severity: "high",
        detail: `Payload matches command execution/injection signature (${name}).`,
      });
    }
  }

  // Check credential/secret disclosures
  for (const { regex, name } of CREDENTIAL_LEAK_PATTERNS) {
    if (regex.test(rawText)) {
      suspiciousFlags.push({
        name,
        severity: "medium",
        detail: `Potential credential or sensitive token pattern detected (${name}).`,
      });
    }
  }

  // Check high entropy / base64 payloads
  if (isHighEntropy && /^[A-Za-z0-9+/=]{32,}$/.test(rawText.trim())) {
    suspiciousFlags.push({
      name: "Obfuscated / Base64 Encoded Block",
      severity: "medium",
      detail: `Unusually high Shannon entropy (${entropy}) with Base64 alphabet. Potential obfuscated shellcode or config.`,
    });
  }

  let suggestedAction = "Safe to view. No malicious patterns identified in raw text.";
  if (suspiciousFlags.some((f) => f.severity === "high")) {
    suggestedAction =
      "CRITICAL: Do NOT execute or pipe this text into any terminal, script, or browser console.";
  } else if (suspiciousFlags.length > 0) {
    suggestedAction =
      "CAUTION: Text contains sensitive tokens or high-entropy data. Handle with care.";
  }

  return {
    rawText,
    length,
    wordCount,
    entropy,
    isHighEntropy,
    suspiciousFlags,
    suggestedAction,
  };
}
