/**
 * Returns the canonical base URL for the application.
 * Ensures localhost is never emitted in production sitemaps, robots, or metadata.
 */
export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL;

  // If a valid production URL is configured (not localhost)
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }

  // Vercel system production URL (e.g., xerova-lab.vercel.app)
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "");
  }

  // Fallback for local development when not in production
  if (process.env.NODE_ENV === "development" && envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // Default live site URL
  return "https://xerova-lab.vercel.app";
}
