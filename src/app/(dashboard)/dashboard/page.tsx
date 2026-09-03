"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  MessageSquare,
  FileText,
  Activity,
  AlertTriangle,
  TrendingUp,
  Globe,
  Loader2,
  ArrowRight,
  Plus,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThreatScoreGauge } from "@/components/dashboard/ThreatScoreGauge";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { ThreatTrendsChart } from "@/components/dashboard/ThreatTrendsChart";
import { RecentInvestigations } from "@/components/dashboard/RecentInvestigations";
import { LatestCVEs } from "@/components/dashboard/LatestCVEs";
import { LiveThreatPulses, type PulseItem } from "@/components/dashboard/LiveThreatPulses";
import { getRiskColor, getRiskLabel } from "@/lib/utils";

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statsData, setStatsData] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cvesData, setCvesData] = useState<any[] | null>(null);
  const [pulsesData, setPulsesData] = useState<PulseItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, cvesRes, pulsesRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/cves"),
          fetch("/api/dashboard/pulses"),
        ]);

        if (statsRes.ok) {
          setStatsData(await statsRes.json());
        }

        if (cvesRes.ok) {
          const cvesJson = await cvesRes.json();
          setCvesData(cvesJson.cves || []);
        }

        if (pulsesRes.ok) {
          const pulsesJson = await pulsesRes.json();
          setPulsesData(pulsesJson.pulses || []);
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh]" role="status" aria-label="Loading dashboard">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground mt-3 font-mono">Connecting threat telemetry streams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-status-error/10 border border-status-error/25 text-status-error p-4 rounded-2xl flex items-center gap-3 max-w-md">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wider">Telemetry Link Error</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const threatScore = statsData?.threatScore ?? 42;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-5"
    >
      {/* Top Welcome Bar & Horizontal Modular Action Cards */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-1"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome, <span className="text-primary font-normal">Analyst!</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Automate threat investigations, correlate IOCs, and orchestrate real-time defense.
          </p>
        </div>

        {/* Reference Horizontal Quick-Action Pill Cards */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 max-w-full">
          {/* Quick Create Report Pill */}
          <Link
            href="/reports"
            className="w-10 h-10 rounded-xl bg-white text-black hover:bg-white/90 transition-all flex items-center justify-center shrink-0 shadow-lg active:scale-95"
            title="Create New Report"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </Link>

          {/* Action 1: Threat Lookup */}
          <Link
            href="/threats"
            className="px-3.5 py-2 rounded-xl bg-[#12141a] hover:bg-[#181b22] border border-white/[0.08] flex items-center gap-3 shrink-0 group transition-all"
          >
            <div className="text-left">
              <div className="flex items-center gap-1 text-xs font-semibold text-white group-hover:text-primary transition-colors">
                <span>Threat Lookup</span>
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">Scan IP, Domain, Hash</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Action 2: AI Copilot */}
          <Link
            href="/assistant"
            className="px-3.5 py-2 rounded-xl bg-[#12141a] hover:bg-[#181b22] border border-white/[0.08] flex items-center gap-3 shrink-0 group transition-all"
          >
            <div className="text-left">
              <div className="flex items-center gap-1 text-xs font-semibold text-white group-hover:text-primary transition-colors">
                <span>AI Security Copilot</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">Gemini Threat Analyst</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Action 3: Incident Reports */}
          <Link
            href="/reports"
            className="hidden sm:flex px-3.5 py-2 rounded-xl bg-[#12141a] hover:bg-[#181b22] border border-white/[0.08] items-center gap-3 shrink-0 group transition-all"
          >
            <div className="text-left">
              <div className="flex items-center gap-1 text-xs font-semibold text-white group-hover:text-primary transition-colors">
                <span>Report AI</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">Incident &amp; Audit Docs</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </motion.div>

      {/* Primary Asymmetric Grid (Matching Reference Top Half) */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        {/* Panel 1: Threat Overview Instrument (38% / 5 cols) */}
        <Card className="lg:col-span-5 bg-[#12141a] border-white/[0.08] flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Threat Posture &amp; Score
              </span>
              <span className="text-xs font-mono text-muted-foreground px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                Realtime Feeds ⌵
              </span>
            </div>

            {/* Score Showcase */}
            <div className="pt-5 pb-3 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-medium block">
                  Overall Threat Level
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${getRiskColor(threatScore)}`}>
                    {threatScore}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">/ 100</span>
                </div>
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs uppercase font-bold px-2.5 py-0.5 rounded-full border ${getRiskColor(threatScore)}`}
                >
                  {getRiskLabel(threatScore)}
                </Badge>
              </div>

              {/* Minimal Instrument Radial Ring */}
              <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                <ThreatScoreGauge score={threatScore} />
              </div>
            </div>
          </div>

          {/* Sub-Metric Bars */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Inbound Attack Vector</span>
              <span className="font-mono text-white font-semibold">Low (12%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "12%" }} />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">Known Malicious IOC Matches</span>
              <span className="font-mono text-status-warning font-semibold">Active (38%)</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-status-warning rounded-full" style={{ width: "38%" }} />
            </div>
          </div>
        </Card>

        {/* Panel 2: Recent Investigations Table (62% / 7 cols - Matching "Tasks List" in reference) */}
        <Card className="lg:col-span-7 bg-[#12141a] border-white/[0.08] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">Recent Investigations</span>
                <button
                  type="button"
                  aria-label="Filter investigations"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/90 font-medium px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <SlidersHorizontal className="w-3 h-3 text-primary" />
                  <span>Filter</span>
                </button>
              </div>
              <Link
                href="/threats"
                className="text-xs text-primary font-medium flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
              >
                <span>See all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-2">
              <RecentInvestigations data={statsData?.recentSearches || []} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Secondary Asymmetric Grid (Matching Reference Bottom Half) */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        {/* Panel 3: Highlight / Action Card (Matching "Optimize Workflow" reference card - 5 cols) */}
        <Card className="lg:col-span-5 bg-gradient-to-br from-[#121a1f] via-[#10141b] to-[#0c0e14] border-cyan-500/20 p-5 flex flex-col justify-start gap-4 relative overflow-hidden group shadow-lg">
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> Active Autonomous Defense
              </span>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Previous card slide"
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  aria-label="Next card slide"
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-white mt-3 leading-snug">
              Automate IOC correlation &amp; containment in &lt;60s
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-sm">
              Deploy automated hunting rules across VirusTotal, AlienVault OTX, and Shodan telemetry feeds to stop malicious pivots.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <Link
              href="/threats"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-cyan-400 transition-all shadow-md active:scale-95"
            >
              Analyze Indicator
            </Link>
          </div>

          {/* Ambient subtle cyber mesh silhouette in background */}
          <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all duration-500" />
        </Card>

        {/* Panel 4: Threat Intelligence Trends Curve (Matching "Completed Tasks" reference chart - 7 cols) */}
        <Card className="lg:col-span-7 bg-[#12141a] border-white/[0.08] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Threat Intelligence Trends</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  +10% today
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">Last 7 Days ⌵</span>
            </div>

            <div className="pt-3">
              <ThreatTrendsChart data={statsData?.trendData || []} />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tertiary Row: Live Threat Pulses & Latest CVE Feeds */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Live OTX Global Pulses */}
        <Card className="bg-[#12141a] border-white/[0.08] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-white">Live Threat Pulses</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              AlienVault OTX
            </Badge>
          </div>
          <LiveThreatPulses data={pulsesData || []} />
        </Card>

        {/* Latest CVE Telemetry */}
        <Card className="bg-[#12141a] border-white/[0.08] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span className="text-sm font-semibold text-white">Latest Vulnerabilities</span>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              NVD Feed
            </Badge>
          </div>
          <LatestCVEs data={cvesData || []} />
        </Card>
      </motion.div>
    </motion.div>
  );
}
