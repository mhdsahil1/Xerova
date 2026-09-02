// ============================================
// XEROVA — Explainable Threat Intelligence Results Component
// ============================================
// Visual Hierarchy:
// 1. Unified XEROVA Risk Score & Verdict Hero
// 2. "Why This Score?" Transparent Attribution Section
// 3. Identified Risk Factors
// 4. Threat Intelligence Engines (Overview, Filter Controls, Search, Engine Grid)
// 5. Structural & Technical Heuristic Telemetry
// 6. Detailed Telemetry Findings
// 7. Actionable Security Recommendation Footnote

"use client";

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Layers,
  Lock,
  Unlock,
  Clock,
  KeyRound,
  HelpCircle,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Server,
  Activity,
  Check,
  TrendingUp,
  Info,
  SlidersHorizontal,
  XCircle,
  Terminal,
  Database,
  FileSearch,
} from "lucide-react";
import type { URLAnalysisResult } from "@/lib/url-analyzer";
import type { NormalizedProviderResult, ProviderStatus } from "@/types";

interface URLAnalysisComponentProps {
  analysis: URLAnalysisResult;
}

const PROVIDER_METADATA: Record<string, { subtitle: string }> = {
  VirusTotal: { subtitle: "Multi-engine malware & URL reputation" },
  "AlienVault OTX": { subtitle: "Open Threat Exchange & threat pulses" },
  "Criminal IP": { subtitle: "AI-based threat intelligence & domain scoring" },
  AbuseIPDB: { subtitle: "IP reputation & community abuse reports" },
  Abusix: { subtitle: "Network security & real-time blocklists" },
  "alphaMountain.ai": { subtitle: "AI domain rating & risk categorizations" },
  "CheckPhish.ai": { subtitle: "Deep learning neural phishing scanner" },
  "urlscan.io": { subtitle: "Automated web sandbox & DOM inspection" },
  PhishStats: { subtitle: "Real-time phishing threat feed & index" },
  Cloudmersive: { subtitle: "Website anti-virus & web threat scanner" },
  "Yandex Safe Browsing": { subtitle: "Search safety index & malware detection" },
  "VXVault Threat Feed": { subtitle: "Community live malware distribution database" },
  URLQuery: { subtitle: "Historical sandbox submissions & reports" },
  IPStack: { subtitle: "Infrastructure threat level & proxy detection" },
  Shodan: { subtitle: "Host vulnerability & exposed port scanner" },
};

const severityBadgeColors: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-600 text-white",
  MEDIUM: "bg-yellow-500 text-slate-950 font-bold",
  LOW: "bg-blue-600 text-white",
};

const severityFindingColors: Record<string, string> = {
  CRITICAL: "bg-red-500/10 border-red-500/30 text-red-400",
  HIGH: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  MEDIUM: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  LOW: "bg-blue-500/10 border-blue-500/30 text-blue-400",
};

const VerdictIcon = ({ verdict }: { verdict: string }) => {
  switch (verdict) {
    case "SAFE":
      return <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />;
    case "SUSPICIOUS":
      return <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />;
    case "MALICIOUS":
      return <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0" />;
    default:
      return <Shield className="w-8 h-8 text-slate-400 shrink-0" />;
  }
};

export function URLAnalysisComponent({ analysis }: URLAnalysisComponentProps) {
  // Navigation and filter states
  const [activeFilter, setActiveFilter] = useState<
    "all" | "threat" | "clean" | "issues" | "unavailable"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    riskFactors: true,
    structural: true,
    findings: true,
  });

  // Expandable telemetry details per card
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleDetail = (provider: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const getRiskColor = (score: number) => {
    if (score < 25) return "text-emerald-500";
    if (score < 50) return "text-yellow-500";
    if (score < 75) return "text-orange-500";
    return "text-red-500";
  };

  // Extract all provider results
  const allProviders = useMemo(() => {
    if (!analysis.providerResults) return [];
    return Object.values(analysis.providerResults);
  }, [analysis.providerResults]);

  // Status-specific lists
  const threatProviders = useMemo(
    () => allProviders.filter((p) => p.status === "threat").sort((a, b) => (b.scoreContribution || 0) - (a.scoreContribution || 0)),
    [allProviders]
  );
  const cleanProviders = useMemo(
    () => allProviders.filter((p) => p.status === "clean"),
    [allProviders]
  );
  const errorOrTimeoutProviders = useMemo(
    () => allProviders.filter((p) => p.status === "error" || p.status === "timeout" || p.status === "unknown"),
    [allProviders]
  );
  const unavailableProviders = useMemo(
    () => allProviders.filter((p) => p.status === "unavailable"),
    [allProviders]
  );

  // Intelligent sorting function: Threat (by score desc) -> Clean -> Error -> Timeout -> Unavailable -> Unknown
  const sortProviders = (list: NormalizedProviderResult[]) => {
    const statusPriority: Record<ProviderStatus, number> = {
      threat: 0,
      clean: 1,
      error: 2,
      timeout: 3,
      unavailable: 4,
      unknown: 5,
    };

    return [...list].sort((a, b) => {
      const pA = statusPriority[a.status] ?? 99;
      const pB = statusPriority[b.status] ?? 99;
      if (pA !== pB) return pA - pB;
      if (a.status === "threat" && b.status === "threat") {
        return (b.scoreContribution || 0) - (a.scoreContribution || 0);
      }
      return a.provider.localeCompare(b.provider);
    });
  };

  // Filtered and sorted providers based on filter & search
  const displayedProviders = useMemo(() => {
    let list = allProviders;
    if (activeFilter === "threat") list = threatProviders;
    else if (activeFilter === "clean") list = cleanProviders;
    else if (activeFilter === "issues") list = errorOrTimeoutProviders;
    else if (activeFilter === "unavailable") list = unavailableProviders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.provider.toLowerCase().includes(q) ||
          p.evidence.some((e) => e.toLowerCase().includes(q)) ||
          p.error?.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q)
      );
    }

    return sortProviders(list);
  }, [allProviders, activeFilter, searchQuery, threatProviders, cleanProviders, errorOrTimeoutProviders, unavailableProviders]);

  // Coverage statistics from backend or computed
  const coverage = analysis.coverage || {
    totalRelevant: allProviders.length,
    responded: threatProviders.length + cleanProviders.length,
    threats: threatProviders.length,
    clean: cleanProviders.length,
    errors: allProviders.filter((p) => p.status === "error").length,
    timeouts: allProviders.filter((p) => p.status === "timeout").length,
    unavailable: unavailableProviders.length,
    unknown: allProviders.filter((p) => p.status === "unknown").length,
    percentage:
      allProviders.length > 0
        ? Math.round(((threatProviders.length + cleanProviders.length) / allProviders.length) * 100)
        : 100,
  };

  // Raw vs Composite score calculations
  const rawThreatScore = threatProviders.reduce((sum, p) => Math.max(sum, p.scoreContribution || 0), 0);
  const localScore = analysis.riskBreakdown?.localHeuristicRisk ?? 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* ============================================================ */}
      {/* 1. UNIFIED XEROVA RISK SCORE & VERDICT HERO                  */}
      {/* ============================================================ */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <VerdictIcon verdict={analysis.verdict} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  XEROVA URL Threat Intelligence
                </h1>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    analysis.verdict === "SAFE"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : analysis.verdict === "SUSPICIOUS"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {analysis.verdict}
                </span>
                {analysis.targetType && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-mono uppercase font-semibold border border-border/60">
                    Scope: {analysis.targetType}
                  </span>
                )}
              </div>
              <p className="text-sm font-mono text-muted-foreground break-all mt-1.5 selection:bg-primary/20">
                {analysis.url}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
              Threat Level
            </div>
            <div
              className={`text-lg font-black tracking-wide uppercase mt-0.5 ${
                analysis.threatLevel === "CRITICAL"
                  ? "text-rose-500"
                  : analysis.threatLevel === "HIGH"
                    ? "text-orange-500"
                    : analysis.threatLevel === "MEDIUM"
                      ? "text-amber-500"
                      : "text-emerald-500"
              }`}
            >
              {analysis.threatLevel}
            </div>
          </div>
        </div>

        {/* Hero Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Unified Risk Score */}
          <div className="p-4 rounded-xl bg-background/60 border border-border/70 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-muted-foreground">
                XEROVA Risk Score
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-muted font-mono uppercase text-muted-foreground font-semibold">
                {analysis.severity}
              </span>
            </div>

            <div>
              <div className={`text-4xl font-black font-mono tracking-tight ${getRiskColor(analysis.riskScore)}`}>
                {analysis.riskScore}
                <span className="text-base font-normal text-muted-foreground font-sans"> / 100</span>
              </div>
              <div className="w-full bg-muted/80 rounded-full h-2.5 mt-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    analysis.riskScore < 35
                      ? "bg-emerald-500"
                      : analysis.riskScore < 60
                        ? "bg-amber-500"
                        : analysis.riskScore < 75
                          ? "bg-orange-500"
                          : "bg-rose-600"
                  }`}
                  style={{ width: `${Math.max(5, analysis.riskScore)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Proprietary contextual scoring combining local heuristic analysis with corroborating threat signals.
            </p>
          </div>

          {/* Intelligence Coverage Meter */}
          <div className="p-4 rounded-xl bg-background/60 border border-border/70 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-muted-foreground">
                Intelligence Coverage
              </span>
              <span className="text-[11px] font-mono font-bold text-foreground">
                {coverage.percentage}%
              </span>
            </div>

            <div>
              <div className="text-2xl font-black font-mono text-foreground">
                {coverage.responded}
                <span className="text-sm font-normal text-muted-foreground font-sans">
                  {" "}
                  / {coverage.totalRelevant} relevant engines
                </span>
              </div>

              {/* Segmented Coverage Bar */}
              <div className="w-full bg-muted/80 rounded-full h-2.5 mt-2.5 flex overflow-hidden gap-0.5 p-0.5">
                {coverage.threats > 0 && (
                  <div
                    className="bg-rose-500 rounded-sm transition-all"
                    style={{ width: `${(coverage.threats / (coverage.totalRelevant || 1)) * 100}%` }}
                    title={`${coverage.threats} threats detected`}
                  />
                )}
                {coverage.clean > 0 && (
                  <div
                    className="bg-emerald-500 rounded-sm transition-all"
                    style={{ width: `${(coverage.clean / (coverage.totalRelevant || 1)) * 100}%` }}
                    title={`${coverage.clean} clean assessments`}
                  />
                )}
                {coverage.errors + coverage.timeouts > 0 && (
                  <div
                    className="bg-amber-500 rounded-sm transition-all"
                    style={{
                      width: `${((coverage.errors + coverage.timeouts) / (coverage.totalRelevant || 1)) * 100}%`,
                    }}
                    title={`${coverage.errors + coverage.timeouts} errors/timeouts`}
                  />
                )}
                {coverage.unavailable > 0 && (
                  <div
                    className="bg-slate-500 rounded-sm transition-all"
                    style={{ width: `${(coverage.unavailable / (coverage.totalRelevant || 1)) * 100}%` }}
                    title={`${coverage.unavailable} unavailable / missing keys`}
                  />
                )}
              </div>
            </div>

            {/* Coverage Badges */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {coverage.threats} Threat{coverage.threats !== 1 ? "s" : ""}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {coverage.clean} Clean
              </span>
              {coverage.errors + coverage.timeouts > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {coverage.errors + coverage.timeouts} Issue{coverage.errors + coverage.timeouts !== 1 ? "s" : ""}
                </span>
              )}
              {coverage.unavailable > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                  {coverage.unavailable} Unconfigured
                </span>
              )}
            </div>
          </div>

          {/* Component Breakdown */}
          <div className="p-4 rounded-xl bg-background/60 border border-border/70 flex flex-col justify-between space-y-2">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-muted-foreground">
              Score Component Breakdown
            </span>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Local Heuristics:</span>
                <span className="font-semibold text-foreground">
                  {analysis.riskBreakdown?.localHeuristicRisk ?? 0} pts
                </span>
              </div>
              <div className="flex justify-between items-center pl-2 text-[11px] text-muted-foreground">
                <span>• Structure & Entropy:</span>
                <span>{analysis.riskBreakdown?.urlStructuralRisk ?? 0}</span>
              </div>
              <div className="flex justify-between items-center pl-2 text-[11px] text-muted-foreground">
                <span>• Domain & Brand:</span>
                <span>{analysis.riskBreakdown?.domainCharacteristicRisk ?? 0}</span>
              </div>
              <div className="flex justify-between items-center pl-2 text-[11px] text-muted-foreground">
                <span>• Path & Query:</span>
                <span>{analysis.riskBreakdown?.pathQueryRisk ?? 0}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-border/50">
                <span className="text-muted-foreground">Threat Intelligence:</span>
                <span className="font-semibold text-foreground">
                  {analysis.riskBreakdown?.threatIntelligenceRisk ?? 0} pts
                </span>
              </div>
            </div>

            <span className="text-[10px] text-muted-foreground font-mono">
              Aggregated via XEROVA Multi-Source Risk Engine
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. "WHY THIS SCORE?" TRANSPARENT ATTRIBUTION SECTION          */}
      {/* ============================================================ */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Why This Score?
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            XEROVA combines local heuristic analysis with positive threat intelligence signals from relevant providers.
            Only providers with <strong className="text-foreground font-mono">status = THREAT</strong> contribute positive risk points.
            Clean, error, timeout, unavailable, and unknown results strictly contribute 0 points.
          </p>
        </div>

        {/* Attribution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {/* Local Heuristic Baseline */}
          <div className="p-3 rounded-xl bg-background/70 border border-cyan-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">
                  Local URL Heuristics
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Structural, Brand & Entropy
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 shrink-0 px-2 py-0.5 rounded bg-cyan-500/10">
              +{localScore} pts
            </span>
          </div>

          {/* Active Threat Providers */}
          {threatProviders.map((provider, i) => (
            <div
              key={`threat-${i}`}
              className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/30 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    {provider.provider}
                  </div>
                  <div className="text-[10px] text-rose-400/80 font-mono">
                    Threat Detected ({provider.relevance || "exact"})
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 shrink-0 px-2 py-0.5 rounded bg-rose-500/15">
                +{provider.scoreContribution} pts
              </span>
            </div>
          ))}

          {/* Non-Threat Providers (Clean / Issues / Unavailable) */}
          {[...cleanProviders, ...errorOrTimeoutProviders, ...unavailableProviders].slice(0, 3).map((provider, i) => (
            <div
              key={`non-threat-${i}`}
              className="p-3 rounded-xl bg-background/40 border border-border/50 flex items-center justify-between gap-2 opacity-75"
            >
              <div className="flex items-center gap-2 min-w-0">
                {provider.status === "clean" ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : provider.status === "timeout" ? (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                ) : provider.status === "unavailable" ? (
                  <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {provider.provider}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase">
                    {provider.status === "unavailable" ? "Unconfigured" : provider.status} (Isolated)
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0 px-2 py-0.5 rounded bg-muted/60">
                +0 pts
              </span>
            </div>
          ))}
        </div>

        {/* Mathematical Composite Callout */}
        <div className="p-3 rounded-xl bg-background/50 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>
              Raw Evidence Risk: <strong className="text-foreground font-bold">{Math.max(localScore, rawThreatScore)} pts</strong>
              {threatProviders.length > 0 && localScore >= 30 ? " (+10 pts corroboration bonus)" : ""}
            </span>
          </div>
          <div className="text-right font-bold text-foreground">
            Normalized XEROVA Unified Score: <span className={getRiskColor(analysis.riskScore)}>{analysis.riskScore} / 100</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. IDENTIFIED RISK FACTORS                                   */}
      {/* ============================================================ */}
      {analysis.riskFactors && analysis.riskFactors.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("riskFactors")}
            className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/40 hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Identified Risk Factors ({analysis.riskFactors.length})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {expandedSections.riskFactors ? "Collapse ▲" : "Expand ▼"}
            </span>
          </button>

          {expandedSections.riskFactors && (
            <div className="p-4 space-y-2.5 border-t border-border/60">
              {analysis.riskFactors.map((rf, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-xl bg-background/60 border border-border/50 gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                        severityBadgeColors[rf.severity] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {rf.severity}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">{rf.reason}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        Source: {rf.source} {rf.category ? `• Category: ${rf.category}` : ""}
                      </div>
                    </div>
                  </div>
                  {rf.scoreContribution !== undefined && rf.scoreContribution > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0 px-2 py-0.5 rounded bg-amber-500/10">
                      +{rf.scoreContribution} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. THREAT INTELLIGENCE ENGINES SECTION                       */}
      {/* ============================================================ */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-md space-y-5">
        {/* Section Header & Compact Overview Statistics */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Threat Intelligence Engines
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Independent evidence and findings from each evaluated security engine
              </p>
            </div>

            {/* Quick Engine Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search engines..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background/80 border border-border/70 rounded-lg focus:outline-none focus:border-primary font-mono placeholder:text-muted-foreground/60 transition-colors"
              />
            </div>
          </div>

          {/* Compact Overview Box */}
          <div className="p-4 rounded-xl bg-background/70 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 font-mono text-center sm:text-left">
              <div>
                <div className="text-xl font-black text-foreground">{coverage.totalRelevant}</div>
                <div className="text-[11px] text-muted-foreground uppercase">Engines Evaluated</div>
              </div>
              <div>
                <div className="text-xl font-black text-rose-400">{coverage.threats}</div>
                <div className="text-[11px] text-muted-foreground uppercase">Threats Detected</div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-400">{coverage.clean}</div>
                <div className="text-[11px] text-muted-foreground uppercase">Clean Assessments</div>
              </div>
              <div>
                <div className="text-xl font-black text-amber-400">{coverage.errors + coverage.timeouts}</div>
                <div className="text-[11px] text-muted-foreground uppercase">Errors / Timeouts</div>
              </div>
            </div>

            <div className="sm:border-l sm:border-border/60 sm:pl-4 text-center sm:text-right shrink-0">
              <div className="text-xs text-muted-foreground font-mono">
                Coverage: <strong className="text-foreground">{coverage.responded} / {coverage.totalRelevant}</strong> engines
              </div>
              <div className="text-lg font-black font-mono text-primary mt-0.5">
                {coverage.percentage}%
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 uppercase ${
                activeFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              ALL ({allProviders.length})
            </button>

            <button
              onClick={() => setActiveFilter("threat")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 uppercase ${
                activeFilter === "threat"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
              }`}
            >
              THREATS ({threatProviders.length})
            </button>

            <button
              onClick={() => setActiveFilter("clean")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 uppercase ${
                activeFilter === "clean"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              CLEAN ({cleanProviders.length})
            </button>

            <button
              onClick={() => setActiveFilter("issues")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 uppercase ${
                activeFilter === "issues"
                  ? "bg-amber-600 text-slate-950 shadow-sm"
                  : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              ERRORS / TIMEOUTS ({errorOrTimeoutProviders.length})
            </button>

            <button
              onClick={() => setActiveFilter("unavailable")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 uppercase ${
                activeFilter === "unavailable"
                  ? "bg-slate-700 text-slate-200 shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              }`}
            >
              UNAVAILABLE ({unavailableProviders.length})
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Responsive Engine Cards Grid (2 Columns on Desktop)         */}
        {/* ============================================================ */}
        {displayedProviders.length === 0 ? (
          <div className="p-8 text-center bg-background/40 border border-dashed border-border/70 rounded-xl space-y-2">
            <Search className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">
              No threat intelligence engines match your current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedProviders.map((provider) => (
              <EngineCard
                key={provider.provider}
                provider={provider}
                isExpanded={Boolean(expandedDetails[provider.provider])}
                onToggleExpand={() => toggleDetail(provider.provider)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. XEROVA STRUCTURAL & TECHNICAL TELEMETRY                   */}
      {/* ============================================================ */}
      <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection("structural")}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              XEROVA Structural & Heuristic Telemetry
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {expandedSections.structural ? "Collapse ▲" : "Expand ▼"}
          </span>
        </button>

        {expandedSections.structural && (
          <div className="p-5 space-y-4 border-t border-border/60">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">Protocol</div>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-foreground">
                  {analysis.structural.protocol === "https" ? (
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="uppercase text-xs font-mono">{analysis.structural.protocol}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">Registered Domain</div>
                <div className="mt-1 font-semibold text-foreground truncate font-mono text-xs" title={analysis.structural.domain}>
                  {analysis.structural.domain || "N/A"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">Hostname</div>
                <div className="mt-1 font-semibold text-foreground truncate font-mono text-xs" title={analysis.structural.hostname}>
                  {analysis.structural.hostname}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">Port / Service</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.port || (analysis.structural.protocol === "https" ? "443" : "80")}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">URL Length</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.urlLength} characters
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">Subdomain Depth</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.subdominCount} subdomains
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">Shannon Entropy</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.entropy}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                <div className="text-[10px] uppercase font-mono text-muted-foreground">Host Classification</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.isIPBased ? "Direct IP Host" : "Standard Domain"}
                </div>
              </div>
            </div>

            {analysis.domainCharacteristics.brandImpersonationDetected && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Target Brand Impersonation:</strong> Domain contains unauthorized keyword match for{" "}
                  <strong>{analysis.domainCharacteristics.impersonatedBrand?.toUpperCase()}</strong> on a non-official host.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 6. DETAILED TELEMETRY FINDINGS                               */}
      {/* ============================================================ */}
      {analysis.findings && analysis.findings.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("findings")}
            className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/40 hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Detailed Telemetry Findings ({analysis.findings.length})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {expandedSections.findings ? "Collapse ▲" : "Expand ▼"}
            </span>
          </button>

          {expandedSections.findings && (
            <div className="p-4 space-y-2.5 border-t border-border/60">
              {analysis.findings.map((finding, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 pl-4 py-3 rounded-r-xl border ${
                    severityFindingColors[finding.severity] || "bg-muted/30 border-border text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        severityBadgeColors[finding.severity]
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                      {finding.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{finding.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. ACTIONABLE SECURITY RECOMMENDATION FOOTNOTE               */}
      {/* ============================================================ */}
      <div
        className={`rounded-2xl p-5 border shadow-sm ${
          analysis.verdict === "SAFE"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : analysis.verdict === "SUSPICIOUS"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        }`}
      >
        <div className="flex items-start gap-3">
          <VerdictIcon verdict={analysis.verdict} />
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {analysis.verdict === "SAFE"
                ? "Security Recommendation: Low Risk"
                : analysis.verdict === "SUSPICIOUS"
                  ? "Security Recommendation: Exercise Caution"
                  : "Security Recommendation: High Threat Detected — Block Access Immediately"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {analysis.verdict === "SAFE"
                ? "This URL exhibits low composite risk and no active indicators of brand impersonation or credential theft across responsive threat engines. Standard browsing caution applies."
                : analysis.verdict === "SUSPICIOUS"
                  ? "Suspicious structural, credential, or query patterns detected. Avoid submitting passwords, MFA tokens, payment credentials, or downloading unrecognized attachments."
                  : "High confidence of malicious intent, brand impersonation, or weaponized attack infrastructure. Block access across organizational firewalls and endpoint security tools."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Internal Subcomponent: Individual Engine Card
// ============================================================
function EngineCard({
  provider,
  isExpanded,
  onToggleExpand,
}: {
  provider: NormalizedProviderResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const metadata = PROVIDER_METADATA[provider.provider] || {
    subtitle: "Threat intelligence engine",
  };

  const getStatusDisplay = (status: ProviderStatus) => {
    switch (status) {
      case "threat":
        return {
          label: "THREAT DETECTED",
          badgeClass: "bg-rose-600 text-white",
          borderClass: "border-rose-500/40",
          cardBg: "bg-rose-500/5",
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        };
      case "clean":
        return {
          label: "CLEAN",
          badgeClass: "bg-emerald-600 text-white",
          borderClass: "border-emerald-500/30",
          cardBg: "bg-emerald-500/5",
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        };
      case "error":
        return {
          label: "ERROR / UNREACHABLE",
          badgeClass: "bg-amber-600 text-slate-950 font-bold",
          borderClass: "border-amber-500/30",
          cardBg: "bg-amber-500/5",
          icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
        };
      case "timeout":
        return {
          label: "TIMEOUT",
          badgeClass: "bg-yellow-600 text-slate-950 font-bold",
          borderClass: "border-yellow-500/30",
          cardBg: "bg-yellow-500/5",
          icon: <Clock className="w-4 h-4 text-yellow-400" />,
        };
      case "unavailable":
        return {
          label: "UNAVAILABLE",
          badgeClass: "bg-slate-700 text-slate-300",
          borderClass: "border-border/50",
          cardBg: "bg-background/40",
          icon: <KeyRound className="w-4 h-4 text-slate-400" />,
        };
      case "unknown":
      default:
        return {
          label: "UNKNOWN / INCONCLUSIVE",
          badgeClass: "bg-indigo-600 text-white",
          borderClass: "border-indigo-500/30",
          cardBg: "bg-indigo-500/5",
          icon: <HelpCircle className="w-4 h-4 text-indigo-400" />,
        };
    }
  };

  const statusInfo = getStatusDisplay(provider.status);
  const hasDetails = provider.details && Object.keys(provider.details).length > 0;

  return (
    <div
      className={`p-5 rounded-2xl border ${statusInfo.borderClass} ${statusInfo.cardBg} transition-all duration-200 flex flex-col justify-between space-y-4`}
    >
      {/* Top Engine Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 shrink-0">{statusInfo.icon}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-foreground truncate">
                  {provider.provider}
                </span>
                {provider.relevance && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono uppercase">
                    Match: {provider.relevance}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                {metadata.subtitle}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md shrink-0 tracking-wider ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Score Contribution Callout */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-xs font-mono">
          <span className="text-muted-foreground font-medium">Contribution:</span>
          {provider.status === "threat" && provider.scoreContribution > 0 ? (
            <span className="font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/15">
              +{provider.scoreContribution} pts
            </span>
          ) : (
            <span className="text-muted-foreground px-2 py-0.5 rounded bg-muted/60">
              +0 pts
            </span>
          )}
        </div>
      </div>

      {/* Evidence & Findings Body */}
      <div className="space-y-2 text-xs">
        {provider.status === "threat" && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold font-mono uppercase text-muted-foreground">
              Evidence Returned
            </div>
            {provider.evidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-foreground leading-relaxed text-xs">
                <span className="text-rose-400 shrink-0 mt-0.5">•</span>
                <span>{ev}</span>
              </div>
            ))}
          </div>
        )}

        {provider.status === "clean" && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold font-mono uppercase text-muted-foreground">
              Assessment
            </div>
            {provider.evidence.length > 0 ? (
              provider.evidence.map((ev, i) => (
                <div key={i} className="flex items-start gap-2 text-muted-foreground leading-relaxed text-xs">
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                  <span>{ev}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Query completed successfully. No malicious indicators or threat matches found.</span>
              </div>
            )}
          </div>
        )}

        {provider.status === "error" && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-xs space-y-1 font-mono">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Provider Query Failed</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {provider.error || "Service encountered a network or remote API exception."}
            </p>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-amber-500/20">
              This provider failure does NOT increase the risk score.
            </p>
          </div>
        )}

        {provider.status === "timeout" && (
          <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/90 text-xs space-y-1 font-mono">
            <div className="font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Request Exceeded 12s Timeout</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              The provider result was not available within the allowed time window.
            </p>
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-yellow-500/20">
              This provider timeout does NOT increase the risk score.
            </p>
          </div>
        )}

        {provider.status === "unavailable" && (
          <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-muted-foreground text-xs space-y-1 font-mono">
            <div className="font-semibold flex items-center gap-1.5 text-foreground">
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              <span>API Key Not Configured</span>
            </div>
            <p className="text-[11px]">
              This engine was not queried because the corresponding API key or configuration is not active in the environment.
            </p>
          </div>
        )}

        {provider.status === "unknown" && (
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs space-y-1 font-mono">
            <div className="font-semibold flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Inconclusive / Queued Response</span>
            </div>
            <p className="text-[11px]">
              {provider.error || "Provider returned an indeterminate disposition or scan queued status."}
            </p>
          </div>
        )}
      </div>

      {/* Expandable Curated Telemetry Details */}
      {hasDetails && (
        <div className="pt-2 border-t border-border/40">
          <button
            onClick={onToggleExpand}
            className="w-full flex items-center justify-between text-xs font-mono text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span>{isExpanded ? "Hide telemetry details ↑" : "View telemetry details ↓"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="mt-2.5 p-3 rounded-xl bg-background/90 border border-border/70 text-xs font-mono space-y-2">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider pb-1 border-b border-border/40">
                Curated Engine Telemetry
              </div>
              <CuratedDetailsRenderer provider={provider.provider} details={provider.details!} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Internal Helper: Curated Telemetry Renderer (No Raw Dumps)
// ============================================================
function CuratedDetailsRenderer({
  provider,
  details,
}: {
  provider: string;
  details: Record<string, unknown>;
}) {
  if (provider === "VirusTotal") {
    return (
      <div className="space-y-1 text-[11px]">
        {details.malicious !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Malicious Vendors:</span>
            <span className="font-semibold text-rose-400">{String(details.malicious)}</span>
          </div>
        )}
        {details.suspicious !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Suspicious Vendors:</span>
            <span className="font-semibold text-amber-400">{String(details.suspicious)}</span>
          </div>
        )}
        {details.harmless !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Harmless Vendors:</span>
            <span className="font-semibold text-emerald-400">{String(details.harmless)}</span>
          </div>
        )}
        {details.undetected !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Undetected:</span>
            <span className="font-semibold text-muted-foreground">{String(details.undetected)}</span>
          </div>
        )}
        {details.reputation !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reputation Score:</span>
            <span className="font-semibold text-foreground">{String(details.reputation)}</span>
          </div>
        )}
        {Boolean(details.scanDate) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Analysis:</span>
            <span className="font-semibold text-foreground">
              {new Date(String(details.scanDate)).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (provider === "AlienVault OTX") {
    const pulses = (details.pulsesSample as Array<{ id: string; name: string; author: string }>) || [];
    return (
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pulse Count:</span>
          <span className="font-semibold text-foreground">{String(details.pulseCount ?? 0)}</span>
        </div>
        {Boolean(details.sourceType) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Match Type:</span>
            <span className="font-semibold uppercase text-primary">{String(details.sourceType)}</span>
          </div>
        )}
        {pulses.length > 0 && (
          <div className="pt-1 space-y-1">
            <span className="text-muted-foreground text-[10px] uppercase">Sample Pulses:</span>
            {pulses.map((p, idx) => (
              <div key={idx} className="p-1.5 rounded bg-muted/40 text-[10px] text-foreground">
                <strong>{p.name}</strong> <span className="text-muted-foreground">(by {p.author})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (provider === "urlscan.io") {
    const techs = (details.technologies as string[]) || [];
    return (
      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sandbox Verdict:</span>
          <span className={`font-semibold ${details.malicious ? "text-rose-400" : "text-emerald-400"}`}>
            {details.malicious ? "Malicious" : "Clean"}
          </span>
        </div>
        {details.score !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sandbox Score:</span>
            <span className="font-semibold text-foreground">{String(details.score)} / 100</span>
          </div>
        )}
        {techs.length > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Technologies:</span>
            <span className="font-semibold text-foreground truncate max-w-[60%]">{techs.join(", ")}</span>
          </div>
        )}
        {typeof details.screenshotUrl === "string" && details.screenshotUrl && (
          <div className="pt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Screenshot:</span>
            <a
              href={details.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              View Screenshot <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {typeof details.reportUrl === "string" && details.reportUrl && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Full Report:</span>
            <a
              href={details.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              Open urlscan Report <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  if (provider === "CheckPhish.ai") {
    return (
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">AI Disposition:</span>
          <span className="font-semibold uppercase text-foreground">{String(details.disposition ?? "clean")}</span>
        </div>
        {Boolean(details.brand) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Impersonated Brand:</span>
            <span className="font-semibold text-rose-400">{String(details.brand)}</span>
          </div>
        )}
        {Boolean(details.insights) && (
          <div className="pt-1 text-[10px] text-muted-foreground leading-relaxed">
            {String(details.insights)}
          </div>
        )}
      </div>
    );
  }

  if (provider === "Criminal IP") {
    const techs = (details.technologies as string[]) || [];
    return (
      <div className="space-y-1 text-[11px]">
        {details.riskScore !== undefined && details.riskScore !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Risk Score:</span>
            <span className="font-semibold text-foreground">{String(details.riskScore)}</span>
          </div>
        )}
        {details.phishingScore !== undefined && details.phishingScore !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phishing Probability:</span>
            <span className="font-semibold text-foreground">{String(details.phishingScore)}%</span>
          </div>
        )}
        {details.malwareScore !== undefined && details.malwareScore !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Malware Probability:</span>
            <span className="font-semibold text-foreground">{String(details.malwareScore)}%</span>
          </div>
        )}
        {techs.length > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Technologies:</span>
            <span className="font-semibold text-foreground truncate max-w-[60%]">{techs.join(", ")}</span>
          </div>
        )}
      </div>
    );
  }

  // Fallback for any other provider with generic key/value formatting
  return (
    <div className="space-y-1 text-[11px]">
      {Object.entries(details).map(([k, v]) => {
        if (v === undefined || v === null) return null;
        const displayVal =
          typeof v === "boolean"
            ? v ? "True" : "False"
            : typeof v === "object"
              ? Array.isArray(v)
                ? v.slice(0, 4).join(", ") || "Empty"
                : "Object"
              : String(v);

        return (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
            <span className="font-semibold text-foreground truncate max-w-[60%]">{displayVal}</span>
          </div>
        );
      })}
    </div>
  );
}
