// ============================================
// URL Analysis Result Component — Polished
// ============================================

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThreatSourceCard } from "@/components/shared/ThreatSourceCard";
import { RiskScoreDisplay } from "@/components/shared/RiskScoreDisplay";
import type { URLAnalysisResult } from "@/lib/url-analyzer";

interface URLAnalysisComponentProps {
  analysis: URLAnalysisResult;
}

const severityBadgeColors: Record<string, string> = {
  CRITICAL: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
  HIGH: "bg-severity-high/15 text-severity-high border-severity-high/30",
  MEDIUM: "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
  LOW: "bg-severity-low/15 text-severity-low border-severity-low/30",
};

const verdictConfig = {
  SAFE: {
    icon: CheckCircle,
    color: "text-status-success",
    bg: "bg-status-success/5 border-status-success/25",
    badge: "bg-status-success/15 text-status-success border-status-success/30",
    description: "No high-confidence indicators of malicious behavior.",
    recommendation: "This URL exhibits low risk. Standard browsing caution applies.",
  },
  SUSPICIOUS: {
    icon: AlertTriangle,
    color: "text-severity-medium",
    bg: "bg-severity-medium/5 border-severity-medium/25",
    badge: "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
    description: "Elevated heuristic or external risk indicators found.",
    recommendation:
      "Suspicious patterns detected. Avoid submitting passwords or personal information on this page.",
  },
  MALICIOUS: {
    icon: AlertCircle,
    color: "text-severity-critical",
    bg: "bg-severity-critical/5 border-severity-critical/25",
    badge: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
    description: "Critical threat detected — domain/URL flagged as malicious.",
    recommendation:
      "High confidence of malicious intent. Block access across all organizational endpoints immediately.",
  },
};

function SectionToggle({
  title,
  icon: Icon,
  expanded,
  onToggle,
  count,
  iconColor = "text-primary",
}: {
  title: string;
  icon: React.ElementType;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
  iconColor?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full px-5 py-3.5 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="text-[10px] ml-1">{count}</Badge>
        )}
      </div>
      <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </motion.div>
    </button>
  );
}

export function URLAnalysisComponent({ analysis }: URLAnalysisComponentProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    riskFactors: true,
    structural: true,
    findings: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const vc = verdictConfig[analysis.verdict as keyof typeof verdictConfig] || verdictConfig.SUSPICIOUS;
  const VerdictIcon = vc.icon;
  const vt = analysis.threatIntelligence?.virusTotal;

  function vtVerdict(): "clean" | "suspicious" | "malicious" | "unknown" {
    if (!vt) return "unknown";
    const mal = vt.maliciousEngines ?? 0;
    if (mal > 5) return "malicious";
    if (mal > 0) return "suspicious";
    return "clean";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-4"
    >
      {/* ─── Hero Card ─── */}
      <div className={`rounded-2xl border ${vc.bg} overflow-hidden`}>
        <div className="flex flex-col md:flex-row">
          {/* Left: Verdict + URL + Scores */}
          <div className="flex-1 p-6 space-y-4">
            {/* Verdict header */}
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${vc.bg} border ${vc.bg.split(" ")[1]} shrink-0`}>
                <VerdictIcon className={`w-6 h-6 ${vc.color}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-lg font-bold text-foreground">URL Security Analysis</h1>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${vc.badge}`}>
                    {analysis.verdict}
                  </span>
                </div>
                <p className="text-xs font-mono text-muted-foreground break-all">{analysis.url}</p>
                <p className="text-xs text-muted-foreground mt-1">{vc.description}</p>
              </div>
            </div>

            {/* Sources */}
            {analysis.sources && analysis.sources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Sources:</span>
                {analysis.sources.map((src, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-secondary/80 border border-border/50 font-mono"
                  >
                    {src}
                  </span>
                ))}
              </div>
            )}

            {/* Score breakdown summary */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                <p className="text-[10px] uppercase font-mono text-muted-foreground">Heuristic Risk</p>
                <p className="text-lg font-black font-mono text-foreground mt-0.5">
                  {analysis.riskBreakdown?.localHeuristicRisk ?? 0}
                  <span className="text-xs font-normal text-muted-foreground">/100</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-background/50 border border-border/40">
                <p className="text-[10px] uppercase font-mono text-muted-foreground">Intel Risk</p>
                <p className="text-lg font-black font-mono text-foreground mt-0.5">
                  {analysis.riskBreakdown?.threatIntelligenceRisk ?? 0}
                  <span className="text-xs font-normal text-muted-foreground">/100</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Score */}
          <div className="w-full md:w-52 p-6 flex flex-col items-center justify-center bg-background/30 border-t md:border-t-0 md:border-l border-border/30">
            <RiskScoreDisplay
              score={analysis.riskScore}
              size="lg"
              showBar
              showLabel
              showExplanation
            />
            <p className="text-[10px] text-muted-foreground text-center mt-3 font-mono">
              Unified Risk Score
            </p>
          </div>
        </div>
      </div>

      {/* ─── Threat Intelligence Sources ─── */}
      {vt && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" />
            Intelligence Sources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ThreatSourceCard
              name="VirusTotal"
              verdict={vtVerdict()}
              stat={`${vt.maliciousEngines ?? 0}/${
                (vt.maliciousEngines ?? 0) +
                (vt.harmlessEngines ?? 0) +
                (vt.suspiciousEngines ?? 0) +
                (vt.undetectedEngines ?? 0)
              }`}
              statLabel="AV engines flagged malicious"
              detail={
                vt.lastAnalysisDate
                  ? `Last analyzed: ${new Date(vt.lastAnalysisDate).toLocaleDateString()}`
                  : undefined
              }
              index={0}
            />
            {(vt.suspiciousEngines ?? 0) > 0 && (
              <ThreatSourceCard
                name="VirusTotal"
                verdict="suspicious"
                stat={`${vt.suspiciousEngines}`}
                statLabel="engines flagged suspicious"
                index={1}
              />
            )}
            <ThreatSourceCard
              name="Local Heuristics"
              verdict={
                (analysis.riskBreakdown?.localHeuristicRisk ?? 0) >= 60
                  ? "malicious"
                  : (analysis.riskBreakdown?.localHeuristicRisk ?? 0) >= 30
                  ? "suspicious"
                  : "clean"
              }
              stat={`${analysis.riskBreakdown?.localHeuristicRisk ?? 0}`}
              statLabel="heuristic risk score"
              index={2}
            />
          </div>
        </div>
      )}

      {/* ─── Risk Factors ─── */}
      {analysis.riskFactors && analysis.riskFactors.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <SectionToggle
            title="Identified Risk Factors"
            icon={ShieldAlert}
            iconColor="text-severity-high"
            expanded={expandedSections.riskFactors}
            onToggle={() => toggleSection("riskFactors")}
            count={analysis.riskFactors.length}
          />
          <AnimatePresence>
            {expandedSections.riskFactors && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-2 border-t border-border/60">
                  {analysis.riskFactors.map((rf, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-start justify-between p-3 rounded-xl bg-background/60 border border-border/50 gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 mt-0.5 ${severityBadgeColors[rf.severity] || "bg-muted text-muted-foreground border-border"}`}>
                          {rf.severity}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{rf.reason}</p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {rf.source}{rf.category ? ` · ${rf.category}` : ""}
                          </p>
                        </div>
                      </div>
                      {rf.scoreContribution !== undefined && rf.scoreContribution > 0 && (
                        <span className="text-xs font-mono font-bold text-severity-high shrink-0">
                          +{rf.scoreContribution} pts
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Structural Analysis ─── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <SectionToggle
          title="Structural & Heuristic Telemetry"
          icon={TrendingUp}
          iconColor="text-cyber-cyan"
          expanded={expandedSections.structural}
          onToggle={() => toggleSection("structural")}
        />
        <AnimatePresence>
          {expandedSections.structural && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4 border-t border-border/60">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Protocol",
                      value: (
                        <div className="flex items-center gap-1.5 mt-1 font-semibold text-foreground">
                          {analysis.structural.protocol === "https" ? (
                            <Lock className="w-3.5 h-3.5 text-status-success" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5 text-severity-medium" />
                          )}
                          <span className="uppercase text-xs">{analysis.structural.protocol}</span>
                        </div>
                      ),
                    },
                    { label: "Domain", value: <span className="text-xs font-mono">{analysis.structural.domain || "N/A"}</span> },
                    { label: "Hostname", value: <span className="text-xs font-mono">{analysis.structural.hostname}</span> },
                    { label: "Port", value: <span className="text-xs font-mono">{analysis.structural.port || (analysis.structural.protocol === "https" ? "443" : "80")}</span> },
                    { label: "URL Length", value: <span className={`text-xs font-mono ${analysis.structural.urlLength > 100 ? "text-severity-medium" : ""}`}>{analysis.structural.urlLength} chars</span> },
                    { label: "Subdomain Depth", value: <span className="text-xs font-mono">{analysis.structural.subdominCount}</span> },
                    {
                      label: "Shannon Entropy",
                      value: (
                        <div>
                          <span className={`text-xs font-mono ${Number(analysis.structural.entropy) > 4 ? "text-severity-medium" : ""}`}>
                            {analysis.structural.entropy}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {Number(analysis.structural.entropy) > 4 ? "High — may be obfuscated" : "Normal"}
                          </p>
                        </div>
                      ),
                    },
                    { label: "Host Type", value: <span className={`text-xs font-mono ${analysis.structural.isIPBased ? "text-severity-medium" : ""}`}>{analysis.structural.isIPBased ? "Direct IP (suspicious)" : "Standard Domain"}</span> },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl bg-background/50 border border-border/40">
                      <p className="text-[10px] uppercase font-mono text-muted-foreground">{label}</p>
                      {value}
                    </div>
                  ))}
                </div>

                {analysis.domainCharacteristics.brandImpersonationDetected && (
                  <div className="p-3.5 rounded-xl bg-severity-critical/10 border border-severity-critical/30 text-severity-critical text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-severity-critical shrink-0 mt-0.5" />
                    <span>
                      <strong>Brand Impersonation Detected:</strong> Domain contains keyword matches for{" "}
                      <strong>{analysis.domainCharacteristics.impersonatedBrand?.toUpperCase()}</strong> but is not the official website. This is a common phishing technique.
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Detailed Findings ─── */}
      {analysis.findings.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <SectionToggle
            title="Detailed Telemetry Findings"
            icon={Layers}
            iconColor="text-cyber-cyan"
            expanded={expandedSections.findings}
            onToggle={() => toggleSection("findings")}
            count={analysis.findings.length}
          />
          <AnimatePresence>
            {expandedSections.findings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-3 border-t border-border/60">
                  {analysis.findings.map((finding, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`border-l-4 pl-4 py-3 rounded-r-xl border bg-background/30 ${
                        finding.severity === "CRITICAL"
                          ? "border-severity-critical"
                          : finding.severity === "HIGH"
                          ? "border-severity-high"
                          : finding.severity === "MEDIUM"
                          ? "border-severity-medium"
                          : "border-severity-low"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${severityBadgeColors[finding.severity] || ""}`}>
                          {finding.severity}
                        </span>
                        <span className="font-semibold text-xs text-foreground uppercase tracking-wide">{finding.category}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{finding.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Security Recommendation ─── */}
      <div className={`rounded-2xl p-5 border ${vc.bg}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${vc.bg} shrink-0`}>
            <VerdictIcon className={`w-5 h-5 ${vc.color}`} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {analysis.verdict === "SAFE"
                ? "Security Recommendation: Low Risk — Safe to Proceed"
                : analysis.verdict === "SUSPICIOUS"
                ? "Security Recommendation: Exercise Caution"
                : "Security Recommendation: High Threat Detected — Block This URL"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{vc.recommendation}</p>
          </div>
        </div>
      </div>

      {/* ─── Score Breakdown Detail ─── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Server className="w-3.5 h-3.5" />
          Score Breakdown
        </h2>
        <div className="space-y-3">
          {[
            { label: "URL Structure & Entropy", value: analysis.riskBreakdown?.urlStructuralRisk ?? 0, max: 25 },
            { label: "Domain & Brand Analysis", value: analysis.riskBreakdown?.domainCharacteristicRisk ?? 0, max: 40 },
            { label: "Path & Query Patterns", value: analysis.riskBreakdown?.pathQueryRisk ?? 0, max: 35 },
            { label: "External Threat Intelligence", value: analysis.riskBreakdown?.threatIntelligenceRisk ?? 0, max: 100 },
          ].map(({ label, value, max }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono font-bold text-foreground">{value}<span className="text-muted-foreground">/{max}</span></span>
              </div>
              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    (value / max) > 0.7
                      ? "bg-severity-critical"
                      : (value / max) > 0.5
                      ? "bg-severity-high"
                      : (value / max) > 0.3
                      ? "bg-severity-medium"
                      : "bg-status-success"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, (value / max) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
