// ============================================
// XEROVA — Bounded Rate Limiter & IP Extraction
// ============================================

import net from "node:net";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Bounded in-memory store to prevent Memory Exhaustion DoS
const MAX_STORE_SIZE = 10_000;
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically without holding process open
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

if (typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}

/**
 * Safely extracts client IP address from standard reverse-proxy headers.
 * Validates that extracted candidate is a valid IPv4 or IPv6 address.
 */
export function getClientIp(request: Request): string {
  // 1. Cloudflare connecting IP
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp && net.isIP(cfIp)) {
    return cfIp;
  }

  // 2. Standard X-Real-IP
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && net.isIP(realIp)) {
    return realIp;
  }

  // 3. X-Forwarded-For: parse leftmost non-spoofed or rightmost proxy IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim());
    for (const part of parts) {
      if (part && net.isIP(part)) {
        return part;
      }
    }
  }

  return "127.0.0.1";
}

/**
 * Check rate limit for a given key with bounded cache storage.
 * @returns `{ allowed: true }` if under limit, `{ allowed: false, retryAfterMs }` if over.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();

  // Enforce memory boundary
  if (store.size >= MAX_STORE_SIZE) {
    // Evict expired or oldest 10%
    let evicted = 0;
    for (const [k, v] of store) {
      if (now > v.resetAt || evicted < MAX_STORE_SIZE * 0.1) {
        store.delete(k);
        evicted++;
      }
    }
  }

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, entry.resetAt - now),
    };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

