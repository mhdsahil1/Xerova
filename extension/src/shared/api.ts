// ============================================
// XEROVA Browser Guard — API Client
// ============================================
// Handles communication with the XEROVA backend.
// Supports automatic fallback across local dev server and production.
// Never returns "SAFE" on failure — always surfaces the error.

import { CONFIG } from "./config.js";
import type { URLAnalysisResult, APIResponse, APIErrorResponse } from "./types.js";

/**
 * Validate that a string is a valid, analyzable URL.
 * Rejects empty strings, non-HTTP(S) protocols, and malformed URLs.
 */
export function validateURL(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "No URL provided." };
  }

  const trimmed = url.trim();

  if (!trimmed) {
    return { valid: false, error: "URL is empty." };
  }

  // Check for supported protocols
  if (!/^https?:\/\//i.test(trimmed)) {
    if (
      trimmed.startsWith("chrome://") ||
      trimmed.startsWith("chrome-extension://") ||
      trimmed.startsWith("edge://") ||
      trimmed.startsWith("about:") ||
      trimmed.startsWith("file://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("javascript:")
    ) {
      return { valid: false, error: "Browser internal pages cannot be analyzed." };
    }
    return { valid: false, error: "Only HTTP and HTTPS URLs can be analyzed." };
  }

  // Validate URL structure
  try {
    new URL(trimmed);
  } catch {
    return { valid: false, error: "Invalid URL format." };
  }

  return { valid: true };
}

/**
 * Analyze a URL using the XEROVA backend.
 * Tries available API server endpoints (e.g. localhost, production).
 */
export async function analyzeURL(url: string): Promise<URLAnalysisResult> {
  const validation = validateURL(url);
  if (!validation.valid) {
    throw new AnalysisError(validation.error || "Invalid URL.", "VALIDATION");
  }

  let lastError: AnalysisError | null = null;

  for (const baseUrl of CONFIG.API_BASE_URLS) {
    const endpoint = `${baseUrl}${CONFIG.API_PATH}`;

    try {
      const result = await fetchFromEndpoint(endpoint, url);
      return result;
    } catch (err) {
      if (err instanceof AnalysisError) {
        lastError = err;
        // If validation or auth error, don't keep trying other servers
        if (err.code === "VALIDATION" || err.code === "AUTH") {
          throw err;
        }
      }
      // Continue to next server candidate if network error or 404
    }
  }

  if (lastError) {
    if (lastError.code === "SERVER" && lastError.message.includes("404")) {
      throw new AnalysisError(
        "Backend API not found. Please start your local dev server ('npm run dev') or deploy the extension API to Vercel.",
        "SERVER"
      );
    }
    if (lastError.code === "NETWORK") {
      throw new AnalysisError(
        "Cannot reach XEROVA server. Make sure 'npm run dev' is running locally or your network is connected.",
        "NETWORK"
      );
    }
    throw lastError;
  }

  throw new AnalysisError(
    "Unable to connect to XEROVA backend. Please start 'npm run dev'.",
    "NETWORK"
  );
}

/**
 * Internal single-endpoint fetch helper with timeout and error parsing.
 */
async function fetchFromEndpoint(
  endpoint: string,
  url: string
): Promise<URLAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Extension-Client": "xerova-browser-guard/1.0.0",
      },
      body: JSON.stringify({ url: url.trim() }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await parseErrorBody(response);

      switch (response.status) {
        case 400:
          throw new AnalysisError(
            errorBody.error || "Invalid URL format.",
            "VALIDATION"
          );
        case 401:
          throw new AnalysisError(
            "Authentication required. Please log in to XEROVA.",
            "AUTH"
          );
        case 404:
          throw new AnalysisError(
            `Endpoint returned 404 on ${endpoint}`,
            "SERVER"
          );
        case 429:
          throw new AnalysisError(
            "Rate limit exceeded. Please wait before trying again.",
            "RATE_LIMIT",
            errorBody.retryAfterMs
          );
        case 500:
          throw new AnalysisError(
            "XEROVA server error. Please try again later.",
            "SERVER"
          );
        default:
          throw new AnalysisError(
            errorBody.error || `Server returned ${response.status}.`,
            "SERVER"
          );
      }
    }

    const data: APIResponse = await response.json();

    if ("success" in data && data.success && data.data) {
      return data.data;
    }

    throw new AnalysisError(
      "Unexpected response structure from XEROVA.",
      "PARSE"
    );
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof AnalysisError) {
      throw err;
    }

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AnalysisError(
        "Analysis request timed out.",
        "TIMEOUT"
      );
    }

    throw new AnalysisError(
      `Network error connecting to ${endpoint}`,
      "NETWORK"
    );
  }
}

/**
 * Safely parse an error response body.
 */
async function parseErrorBody(
  response: Response
): Promise<Partial<APIErrorResponse>> {
  try {
    return await response.json();
  } catch {
    return { error: response.statusText };
  }
}

// --- Custom Error Class ---

export type AnalysisErrorCode =
  | "VALIDATION"
  | "AUTH"
  | "RATE_LIMIT"
  | "SERVER"
  | "TIMEOUT"
  | "NETWORK"
  | "PARSE"
  | "UNKNOWN";

export class AnalysisError extends Error {
  public readonly code: AnalysisErrorCode;
  public readonly retryAfterMs?: number;

  constructor(message: string, code: AnalysisErrorCode, retryAfterMs?: number) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }

  get isRetryable(): boolean {
    return ["SERVER", "TIMEOUT", "NETWORK", "RATE_LIMIT"].includes(this.code);
  }
}
