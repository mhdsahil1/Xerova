// ============================================
// XEROVA Browser Guard — Configuration
// ============================================

export const XEROVA_CONFIG = {
  apiBaseUrl: "https://xerova-lab.vercel.app",
  localApiBaseUrl: "http://localhost:3000",
  websiteUrl: "https://xerova-lab.vercel.app",
  apiPath: "/api/extension/url-analysis",
} as const;

export const CONFIG = {
  // --- Web Application URL (for all redirects & tool links) ---
  // Always redirects user to the live XEROVA platform
  XEROVA_WEB_URL: XEROVA_CONFIG.websiteUrl,

  // --- Primary Production API Base URL ---
  API_BASE_URL: XEROVA_CONFIG.apiBaseUrl,

  // --- Backend API Candidates ---
  // Tries local dev server candidates first, then deployed production URL
  API_BASE_URLS: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    XEROVA_CONFIG.apiBaseUrl,
  ],

  // --- API Endpoint Path ---
  API_PATH: XEROVA_CONFIG.apiPath,

  // --- Timeouts ---
  REQUEST_TIMEOUT_MS: 15_000,

  // --- Cache ---
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_CACHED_RESULTS: 20,

  // --- XEROVA Web App Routes (for redirects) ---
  ROUTES: {
    THREATS: "/threats",
    ASSISTANT: "/assistant",
    REPORTS: "/reports",
    DASHBOARD: "/dashboard",
    SETTINGS: "/settings",
    BROWSER_GUARD: "/browser-guard",
  },
} as const;

/**
 * Build a full URL to the live XEROVA web application.
 */
export function xerovaURL(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${CONFIG.XEROVA_WEB_URL}${cleanPath}`;
}

/**
 * Build the full investigation URL for a given indicator.
 * Opens https://xerova-lab.vercel.app/threats?query=<encoded>&type=url
 */
export function fullInvestigationURL(url: string): string {
  const params = new URLSearchParams({ query: url, type: "url" });
  return `${CONFIG.XEROVA_WEB_URL}${CONFIG.ROUTES.THREATS}?${params.toString()}`;
}
