// ============================================
// URL Analysis Dashboard Page
// ============================================

"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { URLAnalysisComponent } from "@/components/url-analysis/URLAnalysisComponent";

interface URLAnalysisResult {
  url: string;
  verdict: "SAFE" | "SUSPICIOUS" | "MALICIOUS";
  riskScore: number;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  structural: {
    protocol: "http" | "https" | "unknown";
    domain: string;
    hostname: string;
    port: number | null;
    path: string;
    query: string;
    urlLength: number;
    subdominCount: number;
    isIPBased: boolean;
    ipAddress: string | null;
  };
  urlCharacteristics: {
    usesHTTPS: boolean;
    hasExcessiveLength: boolean;
    hasMultipleSubdomains: boolean;
    hasIPAddress: boolean;
    hasSuspiciousPort: boolean;
    hasURLEncoding: boolean;
    hasObfuscatedCharacters: boolean;
    hasExcessiveRedirects: boolean;
    redirectionChain: string[];
    issues: string[];
  };
  domainCharacteristics: {
    hasPunycode: boolean;
    hasSuspiciousTLD: boolean;
    hasExcessiveHyphens: boolean;
    lookalikeDomains: string[];
    brandImpersonationDetected: boolean;
    suspiciousKeywords: string[];
    domainAge: number | null;
    issues: string[];
  };
  threatIntelligence: {
    virusTotal: {
      reputation: number;
      maliciousEngines: number;
      suspiciousEngines: number;
      harmlessEngines: number;
      undetectedEngines: number;
      lastAnalysisDate: string | null;
      categories: Record<string, string>;
    } | null;
    abuseScore: number | null;
    isKnownMalicious: boolean;
    suspiciousReports: number;
  };
  riskBreakdown: {
    urlStructuralRisk: number;
    domainCharacteristicRisk: number;
    threatIntelligenceRisk: number;
    totalRisk: number;
  };
  findings: Array<{
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
  }>;
}

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
      setRecentAnalyses(prev => [data.data, ...prev.slice(0, 4)]);
      setUrl("");
    } catch (err) {
      setError((err as Error).message || "Failed to analyze URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">🔗 URL Analysis</h1>
          <p className="text-lg text-slate-600">
            Advanced malicious URL & website detection. Analyze URL structure, domain characteristics, and threat intelligence.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="Enter a URL to analyze (e.g., https://example.com)"
              className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Analyzing URL..." : "Analyze URL"}
          </button>
        </form>

        {/* Main Analysis Result */}
        {analysis && (
          <div>
            <URLAnalysisComponent analysis={analysis} />
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No analysis yet</h3>
            <p className="text-slate-500">Enter a URL above to get started with comprehensive security analysis</p>
          </div>
        )}

        {/* Recent Analyses */}
        {recentAnalyses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Recent Analyses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentAnalyses.map((recent, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnalysis(recent)}
                  className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-400 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600 truncate">{recent.url}</p>
                      <p className="text-xs text-slate-500 mt-1">{recent.structural.domain}</p>
                    </div>
                    <span className={`ml-2 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                      recent.verdict === "SAFE" ? "bg-green-100 text-green-700" :
                      recent.verdict === "SUSPICIOUS" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {recent.verdict}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Risk: {recent.riskScore}/100</span>
                    <span className="text-xs text-blue-600 group-hover:text-blue-700">View →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-bold text-slate-900 mb-2">Structural Analysis</h3>
            <p className="text-sm text-slate-600">
              Detects HTTP/HTTPS, URL length, subdomains, IP addresses, suspicious ports, URL encoding, and obfuscation.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="text-3xl mb-2">🌐</div>
            <h3 className="font-bold text-slate-900 mb-2">Domain Analysis</h3>
            <p className="text-sm text-slate-600">
              Identifies Punycode, suspicious TLDs, excessive hyphens, lookalike domains, and brand impersonation patterns.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-bold text-slate-900 mb-2">Threat Intelligence</h3>
            <p className="text-sm text-slate-600">
              Integrates with VirusTotal, AbuseIPDB, and other threat intelligence sources for comprehensive analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
