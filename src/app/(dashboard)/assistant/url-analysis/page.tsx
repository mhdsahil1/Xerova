// ============================================
// XEROVA — URL Analysis Dashboard Page
// ============================================

"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { Search, Loader2, Globe, Shield, Sparkles } from "lucide-react";
import { URLAnalysisComponent } from "@/components/url-analysis/URLAnalysisComponent";
import type { URLAnalysisResult } from "@/lib/url-analyzer";

export default function URLAnalysisPage() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [analysis, setAnalysis] = useState<URLAnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<URLAnalysisResult[]>([]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    let urlToAnalyze = url.trim();
    if (!urlToAnalyze.startsWith("http://") && !urlToAnalyze.startsWith("https://")) {
      urlToAnalyze = "https://" + urlToAnalyze;
    }

    try {
      new URL(urlToAnalyze);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/threats/url-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToAnalyze }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await response.json();
      setAnalysis(data.data);
      setRecentAnalyses((prev) => [data.data, ...prev.slice(0, 4)]);
      setUrl("");
    } catch (err) {
      setError((err as Error).message || "Failed to analyze URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Deep URL Threat Intelligence
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Multi-engine malicious URL, domain, and web infrastructure scanner. Inspect local structural heuristics, brand impersonation vectors, and independent threat intelligence engines.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="Enter a target URL to analyze (e.g., https://secure-login.paypal-verification.com)"
              className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl focus:outline-none focus:border-primary text-foreground font-mono text-sm placeholder:text-muted-foreground/60 transition-all shadow-sm"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3.5 text-destructive text-xs font-mono">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Evaluating Threat Intelligence Engines..." : "Analyze URL"}
          </button>
        </form>

        {/* Main Analysis Result */}
        {analysis && (
          <div className="pt-2">
            <URLAnalysisComponent analysis={analysis} />
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <div className="bg-card border border-dashed border-border/80 rounded-2xl p-12 text-center space-y-3">
            <Globe className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No URL Analyzed Yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Enter any URL or domain above to run local heuristic inspection and query active threat intelligence engines with transparent evidence attribution.
            </p>
          </div>
        )}

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Recent In-Session Analyses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recentAnalyses.map((recent, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnalysis(recent)}
                  className="text-left bg-card border border-border/70 rounded-xl p-4 hover:border-primary/50 transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-mono font-bold text-foreground truncate">{recent.url}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{recent.structural.domain}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        recent.verdict === "SAFE"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : recent.verdict === "SUSPICIOUS"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {recent.verdict}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-border/40">
                    <span className="text-muted-foreground">
                      Risk: <strong className="text-foreground">{recent.riskScore}/100</strong> ({recent.threatLevel})
                    </span>
                    <span className="text-primary group-hover:underline text-[11px]">View Analysis →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
