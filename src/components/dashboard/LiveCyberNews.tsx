"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Newspaper,
  ExternalLink,
  Globe,
  Clock,
  RefreshCw,
  Tag,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { CyberNewsArticle } from "@/types";

export interface LiveCyberNewsProps {
  data: CyberNewsArticle[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TILT_MAX = 7;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

function formatTimeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function NewsSpotlightCard({
  article,
  dimmed,
  onHoverStart,
  onHoverEnd,
}: {
  article: CyberNewsArticle;
  dimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card/80 p-4 transition-all duration-300 ${
        dimmed ? "opacity-40 scale-[0.99]" : "opacity-100 scale-100"
      } hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5`}
    >
      {/* Interactive Cursor Spotlight Glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          opacity: glowOpacity,
          background:
            "radial-gradient(400px circle at calc(var(--mouse-x, 0.5) * 100%) calc(var(--mouse-y, 0.5) * 100%), rgba(56, 189, 248, 0.12), transparent 70%)",
        }}
      />

      {/* Shimmer Sweep Animation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[60%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-foreground/[0.05] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]"
      />

      {/* Card Header & Content */}
      <div className="relative z-10 space-y-2.5">
        {/* Source metadata & time */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            {article.sourceIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.sourceIcon}
                alt=""
                className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            <span className="font-mono font-medium text-muted-foreground truncate text-[11px]">
              {article.sourceName}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground shrink-0">
            <Clock className="w-3 h-3 text-muted-foreground/80" />
            <span>{formatTimeAgo(article.pubDate)}</span>
          </div>
        </div>

        {/* Thumbnail & Title Layout */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug group-hover:underline"
            >
              {article.title}
            </a>

            {article.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                {article.description}
              </p>
            )}
          </div>

          {article.imageUrl && !imgError && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border border-border/50 bg-muted/40 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.title}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border/50 text-[11px]">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Tag className="w-3 h-3 text-primary/70 shrink-0" />
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {article.category.slice(0, 2).map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className="text-[9px] font-mono capitalize px-1.5 py-0 border-border/60 bg-muted/40 text-muted-foreground"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors shrink-0 ml-auto"
        >
          <span>Read Story</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Accent Bottom Glow Line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: "linear-gradient(to right, rgba(56, 189, 248, 0.8), transparent)",
        }}
      />
    </motion.div>
  );
}

export function LiveCyberNews({
  data,
  onRefresh,
  isRefreshing = false,
}: LiveCyberNewsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filterTerms: Record<string, string[]> = {
    breach: ["breach", "leak", "ransomware", "extortion", "compromise"],
    vulnerability: ["vulnerability", "zero-day", "exploit", "cve", "patch"],
    ai: ["ai", "artificial intelligence", "copilot", "llm", "agent"],
  };

  const filteredNews = data.filter((item) => {
    if (activeFilter === "all") return true;
    const keywords = filterTerms[activeFilter] || [];
    const textToMatch = `${item.title} ${item.description} ${(item.category || []).join(" ")}`.toLowerCase();
    return keywords.some((k) => textToMatch.includes(k));
  });

  return (
    <div className="space-y-4">
      {/* Category Filter Chips & Refresh Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
            }`}
          >
            All News ({data.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("breach")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              activeFilter === "breach"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
            }`}
          >
            Breaches &amp; Ransomware
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("vulnerability")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              activeFilter === "vulnerability"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
            }`}
          >
            Vulnerabilities
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("ai")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              activeFilter === "ai"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
            }`}
          >
            AI Security
          </button>
        </div>

        {onRefresh && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </Button>
        )}
      </div>

      {/* Grid of News Cards */}
      {filteredNews.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-border/70 p-6 bg-muted/10">
          <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-xs font-medium text-foreground">No news articles match this filter.</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Try switching back to &ldquo;All News&rdquo; or refresh the telemetry stream.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {filteredNews.map((article, idx) => (
            <NewsSpotlightCard
              key={article.id}
              article={article}
              dimmed={hoveredIdx !== null && hoveredIdx !== idx}
              onHoverStart={() => setHoveredIdx(idx)}
              onHoverEnd={() => setHoveredIdx(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
