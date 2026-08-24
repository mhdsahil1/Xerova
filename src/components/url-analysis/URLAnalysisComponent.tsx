// ============================================
// URL Analysis Result Component
// ============================================

"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Shield,
  TrendingUp,
  Globe,
  Layers,
  ShieldAlert,
  Server,
  Lock,
  Unlock,
} from "lucide-react";
import type { URLAnalysisResult } from "@/lib/url-analyzer";

interface URLAnalysisComponentProps {
  analysis: URLAnalysisResult;
}

const severityColors: Record<string, string> = {
  CRITICAL: "bg-red-500/10 border-red-500/30 text-red-400",
  HIGH: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  MEDIUM: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  LOW: "bg-blue-500/10 border-blue-500/30 text-blue-400",
};

const severityBadgeColors: Record<string, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-600 text-white",
  MEDIUM: "bg-yellow-600 text-slate-950 font-bold",
  LOW: "bg-blue-600 text-white",
};

const VerdictIcon = ({ verdict }: { verdict: string }) => {
  switch (verdict) {
    case "SAFE":
      return <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />;
    case "SUSPICIOUS":
      return <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />;
    case "MALICIOUS":
      return <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />;
    default:
      return <Shield className="w-8 h-8 text-slate-400 shrink-0" />;
  }
};

export function URLAnalysisComponent({ analysis }: URLAnalysisComponentProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    riskFactors: true,
    structural: true,
    findings: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getRiskColor = (score: number) => {
    if (score < 25) return "text-emerald-500";
    if (score < 50) return "text-yellow-500";
    if (score < 75) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6 bg-card border border-border rounded-xl shadow-lg">
      {/* Header & Main Summary */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <VerdictIcon verdict={analysis.verdict} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">URL Security Analysis</h1>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                  analysis.verdict === "SAFE" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                  analysis.verdict === "SUSPICIOUS" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                  "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}>
                  {analysis.verdict}
                </span>
              </div>
              <p className="text-sm font-mono text-muted-foreground break-all mt-1">
                {analysis.url}
              </p>
            </div>
          </div>

          {/* Sources badges */}
          {analysis.sources && analysis.sources.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Sources:</span>
              {analysis.sources.map((src, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground border border-border/50 font-mono"
                >
                  {src}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Risk Score Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Verdict Card */}
          <div className="bg-background/50 border border-border/70 rounded-xl p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Verdict & Threat Level
            </div>
            <div className="my-2">
              <div
                className={`text-2xl font-extrabold ${
                  analysis.verdict === "SAFE"
                    ? "text-emerald-400"
                    : analysis.verdict === "SUSPICIOUS"
                      ? "text-amber-400"
                      : "text-rose-400"
                }`}
              >
                {analysis.verdict}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                {analysis.threatLevel} Threat Level
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {analysis.verdict === "SAFE"
                ? "No high-confidence indicators of malicious behavior"
                : analysis.verdict === "SUSPICIOUS"
                  ? "Elevated heuristic or external risk indicators found"
                  : "Critical threat detected — domain/URL flagged as malicious"}
            </div>
          </div>

          {/* Unified Risk Score */}
          <div className="bg-background/50 border border-border/70 rounded-xl p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Unified Risk Score
            </div>
            <div className="my-2">
              <div className={`text-3xl font-black font-mono ${getRiskColor(analysis.riskScore)}`}>
                {analysis.riskScore}
                <span className="text-sm font-normal text-muted-foreground"> / 100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    analysis.riskScore < 35
                      ? "bg-emerald-500"
                      : analysis.riskScore < 60
                        ? "bg-amber-500"
                        : analysis.riskScore < 75
                          ? "bg-orange-500"
                          : "bg-rose-600"
                  }`}
                  style={{ width: `${Math.max(4, analysis.riskScore)}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Severity: {analysis.severity?.toUpperCase()}
            </div>
          </div>

          {/* Risk Breakdown */}
          <div className="bg-background/50 border border-border/70 rounded-xl p-4 flex flex-col justify-between">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Score Breakdown
            </div>
            <div className="space-y-1.5 text-xs font-mono my-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local Heuristics:</span>
                <span className="font-semibold text-foreground">
                  {analysis.riskBreakdown?.localHeuristicRisk ?? 0}/100
                </span>
              </div>
              <div className="flex justify-between pl-2 text-[11px] text-muted-foreground">
                <span>• Structure & Entropy:</span>
                <span>{analysis.riskBreakdown?.urlStructuralRisk ?? 0}/25</span>
              </div>
              <div className="flex justify-between pl-2 text-[11px] text-muted-foreground">
                <span>• Domain & Brand:</span>
                <span>{analysis.riskBreakdown?.domainCharacteristicRisk ?? 0}/40</span>
              </div>
              <div className="flex justify-between pl-2 text-[11px] text-muted-foreground">
                <span>• Path & Query:</span>
                <span>{analysis.riskBreakdown?.pathQueryRisk ?? 0}/35</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Threat Intelligence:</span>
                <span className="font-semibold text-foreground">
                  {analysis.riskBreakdown?.threatIntelligenceRisk ?? 0}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Identified Risk Factors Section */}
      {analysis.riskFactors && analysis.riskFactors.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("riskFactors")}
            className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/40 hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Identified Risk Factors ({analysis.riskFactors.length})
              </h2>
            </div>
            <span
              className={`text-xs text-muted-foreground transition-transform duration-200 ${
                expandedSections.riskFactors ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {expandedSections.riskFactors && (
            <div className="p-4 space-y-2.5 border-t border-border/60">
              {analysis.riskFactors.map((rf, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg bg-background/60 border border-border/50 gap-3"
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
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                      +{rf.scoreContribution} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Structural & Domain Analysis */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection("structural")}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/40 hover:bg-muted/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Structural & Heuristic Telemetry
            </h2>
          </div>
          <span
            className={`text-xs text-muted-foreground transition-transform duration-200 ${
              expandedSections.structural ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>

        {expandedSections.structural && (
          <div className="p-5 space-y-4 border-t border-border/60">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">Protocol</div>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-foreground">
                  {analysis.structural.protocol === "https" ? (
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="uppercase">{analysis.structural.protocol}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">Registered Domain</div>
                <div className="mt-1 font-semibold text-foreground truncate font-mono text-xs" title={analysis.structural.domain}>
                  {analysis.structural.domain || "N/A"}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">Hostname</div>
                <div className="mt-1 font-semibold text-foreground truncate font-mono text-xs" title={analysis.structural.hostname}>
                  {analysis.structural.hostname}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">Port / Service</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.port || (analysis.structural.protocol === "https" ? "443" : "80")}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">URL Length</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.urlLength} characters
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">Subdomains</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.subdominCount} depth
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">Shannon Entropy</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.entropy}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background/50 border border-border/40">
                <div className="text-[11px] uppercase font-mono text-muted-foreground">Host Type</div>
                <div className="mt-1 font-semibold text-foreground font-mono text-xs">
                  {analysis.structural.isIPBased ? "Direct IP Host" : "Standard Domain"}
                </div>
              </div>
            </div>

            {analysis.domainCharacteristics.brandImpersonationDetected && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Target Brand Impersonation:</strong> Domain contains keyword matches for{" "}
                  <strong>{analysis.domainCharacteristics.impersonatedBrand?.toUpperCase()}</strong> on non-official host.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* External Threat Intelligence Vendors */}
      {(analysis.threatIntelligence.virusTotal || analysis.threatIntelligence.alphaMountain || analysis.threatIntelligence.otx || analysis.threatIntelligence.urlquery) && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-muted/40 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                External Threat Intelligence Signals
              </h2>
            </div>
            {analysis.threatIntelligence.virusTotal?.lastAnalysisDate && (
              <span className="text-[11px] text-muted-foreground font-mono">
                Analyzed: {new Date(analysis.threatIntelligence.virusTotal.lastAnalysisDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="p-5 space-y-4">
            {analysis.threatIntelligence.virusTotal && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground uppercase font-mono">VT Malicious</div>
                  <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
                    {analysis.threatIntelligence.virusTotal.maliciousEngines}
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground uppercase font-mono">VT Suspicious</div>
                  <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
                    {analysis.threatIntelligence.virusTotal.suspiciousEngines}
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground uppercase font-mono">VT Harmless</div>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                    {analysis.threatIntelligence.virusTotal.harmlessEngines}
                  </div>
                </div>
                <div className="bg-muted/40 border border-border/40 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground uppercase font-mono">VT Undetected</div>
                  <div className="text-2xl font-extrabold text-muted-foreground font-mono mt-1">
                    {analysis.threatIntelligence.virusTotal.undetectedEngines}
                  </div>
                </div>
              </div>
            )}

            {/* Additional multi-vendor cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {analysis.threatIntelligence.alphaMountain && (
                <div className="p-3.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-cyan-400 font-semibold">alphaMountain.ai</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {analysis.threatIntelligence.alphaMountain.threatScore.toFixed(2)}/5.0
                    </span>
                    <span className="text-xs font-mono text-cyan-300">
                      {analysis.threatIntelligence.alphaMountain.riskScore}% Risk
                    </span>
                  </div>
                </div>
              )}

              {analysis.threatIntelligence.otx && (
                <div className="p-3.5 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-purple-400 font-semibold">AlienVault OTX</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {analysis.threatIntelligence.otx.pulseCount} Pulses
                    </span>
                    <span className="text-xs font-mono text-purple-300">
                      {analysis.threatIntelligence.otx.pulseCount > 0 ? "Flagged" : "Clean"}
                    </span>
                  </div>
                </div>
              )}

              {analysis.threatIntelligence.checkphish && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">CheckPhish.ai</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-foreground capitalize">
                      {analysis.threatIntelligence.checkphish.disposition}
                    </span>
                    <span className="text-xs font-mono text-emerald-300">
                      {analysis.threatIntelligence.checkphish.brand ? `Target: ${analysis.threatIntelligence.checkphish.brand}` : "AI Verified"}
                    </span>
                  </div>
                </div>
              )}

              {analysis.threatIntelligence.urlscan && (
                <div className="p-3.5 rounded-lg bg-orange-500/10 border border-orange-500/20 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-orange-400 font-semibold">urlscan.io Sandbox</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {analysis.threatIntelligence.urlscan.score}/100
                    </span>
                    <span className="text-xs font-mono text-orange-300">
                      {analysis.threatIntelligence.urlscan.malicious ? "Malicious" : "Clean"}
                    </span>
                  </div>
                </div>
              )}

              {analysis.threatIntelligence.phishstats && (
                <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-rose-400 font-semibold">PhishStats</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {analysis.threatIntelligence.phishstats.score.toFixed(1)}/10
                    </span>
                    <span className="text-xs font-mono text-rose-300">
                      {analysis.threatIntelligence.phishstats.targetBrand || analysis.threatIntelligence.phishstats.threatType || "Phish Score"}
                    </span>
                  </div>
                </div>
              )}

              {analysis.threatIntelligence.cloudmersive && (
                <div className="p-3.5 rounded-lg bg-teal-500/10 border border-teal-500/20 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-teal-400 font-semibold">Cloudmersive</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {analysis.providerResults?.["Cloudmersive"]?.status === "threat"
                        ? "Threat"
                        : analysis.providerResults?.["Cloudmersive"]?.status === "error"
                          ? "Error / Unreachable"
                          : "Clean"}
                    </span>
                    <span className="text-xs font-mono text-teal-300">
                      {analysis.threatIntelligence.cloudmersive.websiteThreatType || "Anti-Malware"}
                    </span>
                  </div>
                </div>
              )}

              {analysis.threatIntelligence.urlquery && (
                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                  <span className="text-[11px] font-mono uppercase text-blue-400 font-semibold">URLQuery Sandbox</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold font-mono text-foreground">
                      {analysis.threatIntelligence.urlquery.totalHits} Reports
                    </span>
                    <span className="text-xs font-mono text-blue-300">
                      Historical
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Findings Section */}
      {analysis.findings.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection("findings")}
            className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/40 hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Detailed Telemetry Findings ({analysis.findings.length})
              </h2>
            </div>
            <span
              className={`text-xs text-muted-foreground transition-transform duration-200 ${
                expandedSections.findings ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {expandedSections.findings && (
            <div className="p-4 space-y-3 border-t border-border/60">
              {analysis.findings.map((finding, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 pl-4 py-3 rounded-r-lg border ${
                    severityColors[finding.severity] || "bg-muted/30 border-border text-foreground"
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
                    <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                      {finding.category}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{finding.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Recommendation Footnote */}
      <div
        className={`rounded-xl p-5 border ${
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
                  : "Security Recommendation: High Threat Detected — Block URL"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {analysis.verdict === "SAFE"
                ? "This URL exhibits low risk and no active indicators of brand impersonation or credential theft. Standard browsing caution applies."
                : analysis.verdict === "SUSPICIOUS"
                  ? "Suspicious structural, credential, or query patterns detected. Avoid submitting passwords, tokens, or personal identifiers."
                  : "High confidence of malicious intent, brand impersonation, or credential harvesting infrastructure. Block access across organizational endpoints."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
