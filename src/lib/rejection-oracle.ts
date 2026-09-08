// ==============================================================================
// XEROVA — Rejection Oracle & No-as-a-Service Integration
//
// Powered by No-as-a-Service by @hotheadhacker (MIT License)
// Repository: https://github.com/hotheadhacker/no-as-a-service
// ==============================================================================

export const XEROVA_FALLBACK_REASONS = [
  "XEROVA searched. This page declined to exist.",
  "Access denied by the laws of routing.",
  "404. Even the threat intelligence engine couldn't find this page.",
  "Negative result: requested resource not found.",
  "This endpoint has chosen a life without being found.",
  "Request blocked by XEROVA Defense Matrix: Reason: 'I simply don't feel like it.'",
  "Zero-Trust policy strictly applied: We don't even trust this URL exists.",
  "Automated Sandbox Analysis Verdict: 100% chance of 'Nope'.",
  "XEROVA Firewall Rule 418: The server respectfully declines to locate this asset.",
  "Anomaly detected in routing table: Target coordinates do not correlate with reality.",
  "Packet dropped into /dev/null with extreme prejudice.",
  "AI Security Copilot has deliberated and determined: Absolutely not.",
  "SOC Level 5 Alert: Cognitive refusal protocol initiated for this path.",
  "Cryptographic handshake rejected: Private key says 'No'.",
  "System status: Operational. Page status: Refusing to materialize.",
  "Target endpoint dismissed by the Senior Architect of Procrastination.",
] as const;

export function getRandomFallbackReason(): string {
  const index = Math.floor(Math.random() * XEROVA_FALLBACK_REASONS.length);
  return XEROVA_FALLBACK_REASONS[index];
}

/**
 * Fetches a random rejection reason from the No-as-a-Service API.
 * Uses a strict 1500ms timeout to ensure the 404 page loads instantaneously.
 * Falls back immediately and gracefully to local XEROVA rejection reasons
 * if the upstream service is unreachable, slow, or returns unexpected data.
 */
export async function getRejectionReason(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch("https://naas.isalman.dev/no", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "XEROVA-Console/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return getRandomFallbackReason();
    }

    const data = await res.json();
    if (typeof data?.reason === "string" && data.reason.trim().length > 0) {
      return data.reason.trim();
    }

    return getRandomFallbackReason();
  } catch {
    clearTimeout(timeoutId);
    return getRandomFallbackReason();
  }
}
