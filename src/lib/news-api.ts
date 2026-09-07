// ============================================
// XEROVA — NewsData.io Cyber Threat News Client
// ============================================

import type { CyberNewsArticle } from "@/types";

interface CacheEntry {
  articles: CyberNewsArticle[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const NEWS_CACHE_TTL = 15 * 60_000; // 15 minutes cache to conserve API credits
const FETCH_TIMEOUT = 10_000; // 10s timeout

// Fallback articles in case of rate limit, credit exhaustion, or upstream outage
const FALLBACK_CYBER_NEWS: CyberNewsArticle[] = [
  {
    id: "fallback-cisa-advisory-01",
    title: "CISA Releases Guidance on Active Exploitation of Critical Network Infrastructure",
    link: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    description: "Cybersecurity and Infrastructure Security Agency issues urgent remediation guidance for zero-day vulnerabilities in enterprise edge gateways.",
    pubDate: new Date().toISOString(),
    sourceName: "CISA Advisory",
    sourceIcon: "https://www.cisa.gov/themes/custom/cisa/favicon.ico",
    imageUrl: null,
    category: ["technology", "cybersecurity"],
  },
  {
    id: "fallback-thn-ransomware-02",
    title: "New Multi-Stage Ransomware Variant Targeting Cloud Environments Uncovered",
    link: "https://thehackernews.com",
    description: "Security researchers identify sophisticated evasion techniques designed to bypass EDR telemetry and compromise multi-tenant cloud storage.",
    pubDate: new Date(Date.now() - 3600_000 * 2).toISOString(),
    sourceName: "The Hacker News",
    sourceIcon: "https://thehackernews.com/favicon.ico",
    imageUrl: null,
    category: ["technology", "ransomware"],
  },
  {
    id: "fallback-bleeping-breach-03",
    title: "Zero-Day Vulnerability in Web Framework Exploited in Mass Infiltration Attacks",
    link: "https://www.bleepingcomputer.com",
    description: "Threat actors deploy web shells within minutes of advisory release, prompting urgent patch recommendations from CERT coordination centers.",
    pubDate: new Date(Date.now() - 3600_000 * 5).toISOString(),
    sourceName: "BleepingComputer",
    sourceIcon: "https://www.bleepingcomputer.com/favicon.ico",
    imageUrl: null,
    category: ["technology", "vulnerability"],
  },
  {
    id: "fallback-darkreading-ai-04",
    title: "Adversarial AI Tools Observed Automating Phishing & Spear Phishing Campaigns",
    link: "https://www.darkreading.com",
    description: "Defenders observe a dramatic shift towards automated generative lures and dynamic infrastructure pivoting in enterprise attack campaigns.",
    pubDate: new Date(Date.now() - 3600_000 * 8).toISOString(),
    sourceName: "Dark Reading",
    sourceIcon: "https://www.darkreading.com/favicon.ico",
    imageUrl: null,
    category: ["technology", "ai-security"],
  },
];

export interface FetchNewsOptions {
  query?: string;
  category?: string;
  limit?: number;
  forceRefresh?: boolean;
}

export async function getLatestCyberNews(options: FetchNewsOptions = {}): Promise<CyberNewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  const q = options.query || 'cybersecurity OR breach OR ransomware OR malware';
  const limit = options.limit || 8;
  const cacheKey = `news_${q}_${limit}`;

  if (!options.forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.articles;
    }
  }

  if (!apiKey) {
    console.warn("[NewsData API] NEWSDATA_API_KEY is not defined in environment variables. Serving fallback intelligence.");
    return FALLBACK_CYBER_NEWS.slice(0, limit);
  }

  try {
    const url = new URL("https://newsdata.io/api/1/latest");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("q", q);
    url.searchParams.set("language", "en");
    url.searchParams.set("category", options.category || "technology");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      next: { revalidate: 900 }, // 15-minute Next.js fetch cache
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[NewsData API] Received HTTP ${res.status}: ${res.statusText}. Using fallback news.`);
      return FALLBACK_CYBER_NEWS.slice(0, limit);
    }

    const data = await res.json();
    if (data.status !== "success" || !Array.isArray(data.results)) {
      console.warn("[NewsData API] Unexpected response format:", data);
      return FALLBACK_CYBER_NEWS.slice(0, limit);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const articles: CyberNewsArticle[] = data.results.slice(0, limit).map((item: any) => {
      // Clean description: discard standard upgrade / plan notices
      let cleanDesc = item.description || "";
      if (typeof cleanDesc === "string" && cleanDesc.includes("ONLY AVAILABLE IN")) {
        cleanDesc = "";
      }

      return {
        id: item.article_id || `art_${Math.random().toString(36).substring(2, 9)}`,
        title: item.title || "Untitled Cybersecurity Report",
        link: item.link || "#",
        description: cleanDesc,
        pubDate: item.pubDate || new Date().toISOString(),
        sourceName: item.source_name || item.source_id || "Cyber Threat Feed",
        sourceIcon: item.source_icon || null,
        imageUrl: item.image_url || null,
        category: Array.isArray(item.category) ? item.category : ["technology"],
        country: Array.isArray(item.country) ? item.country : undefined,
        keywords: Array.isArray(item.keywords) ? item.keywords : undefined,
      };
    });

    const finalArticles = articles.length > 0 ? articles : FALLBACK_CYBER_NEWS.slice(0, limit);
    cache.set(cacheKey, { articles: finalArticles, expiresAt: Date.now() + NEWS_CACHE_TTL });
    return finalArticles;
  } catch (error) {
    console.error("[NewsData API Error]:", error);
    return FALLBACK_CYBER_NEWS.slice(0, limit);
  }
}
