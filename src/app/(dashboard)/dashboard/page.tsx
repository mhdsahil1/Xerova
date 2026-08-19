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
  ArrowRight,
  Sparkles,
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

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const quickActions = [
  {
    title: "Threat Lookup",
    description: "Analyze IPs, domains, hashes, URLs & CVEs",
    icon: Search,
    href: "/threats",
    gradient: "from-cyber-cyan to-cyber-blue",
    badge: "Live Intel",
  },
  {
    title: "AI Security Assistant",
    description: "Ask threat analysis & remediation questions",
    icon: MessageSquare,
    href: "/assistant",
    gradient: "from-cyber-purple to-cyber-blue",
    badge: "GenAI",
  },
  {
    title: "Investigation Reports",
    description: "Generate executive PDF & compliance reports",
    icon: FileText,
    href: "/reports",
    gradient: "from-cyber-green to-cyber-teal",
    badge: "Reports",
  },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard skeleton">
      {/* Hero Skeleton */}
      <div className="h-36 rounded-2xl bg-card/40 border border-border/40 p-6 flex flex-col justify-center space-y-3">
        <div className="h-7 w-64 bg-muted/60 rounded-lg" />
        <div className="h-4 w-96 bg-muted/40 rounded-lg" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-card/40 border border-border/40 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted/50 rounded" />
              <div className="w-8 h-8 rounded-lg bg-muted/40" />
            </div>
            <div className="h-7 w-16 bg-muted/60 rounded" />
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-card/40 border border-border/40 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted/50 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-28 bg-muted/50 rounded" />
              <div className="h-3 w-40 bg-muted/30 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-72 rounded-xl bg-card/40 border border-border/40 p-5" />
        <div className="h-72 rounded-xl bg-card/40 border border-border/40 p-5 lg:col-span-2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statsData, setStatsData] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cvesData, setCvesData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, cvesRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/cves"),
        ]);

        if (statsRes.ok) {
          setStatsData(await statsRes.json());
        }

        if (cvesRes.ok) {
          const cvesJson = await cvesRes.json();
          setCvesData(cvesJson.cves || []);
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
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-status-error/10 border border-status-error/20 text-status-error p-5 rounded-xl flex items-start gap-3 max-w-md">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Dashboard Error</h4>
            <p className="text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => window.location.reload()}
              className="mt-3 text-xs"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const defaultStats = [
    { label: "Investigations", value: "0", change: "0%", icon: Activity, color: "text-cyber-cyan" },
    { label: "Critical Threats", value: "0", change: "0%", icon: AlertTriangle, color: "text-severity-critical" },
    { label: "Reports Generated", value: "0", change: "0%", icon: FileText, color: "text-cyber-purple" },
    { label: "Avg Risk Score", value: "0", change: "", icon: Globe, color: "text-cyber-green" },
  ];

  const stats =
    statsData?.stats?.map((s: { label: string; value: string; change: string }, i: number) => ({
      ...s,
      icon: defaultStats[i]?.icon || Activity,
      color: defaultStats[i]?.color || "text-cyber-cyan",
    })) || defaultStats;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-6"
    >
      {/* Hero Welcome Banner */}
      <motion.div
        variants={fadeInUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-card/80 via-card/50 to-primary/10 border border-border/50 p-6 md:p-8"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unified Threat Intelligence</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome to <span className="text-gradient font-black">XEROVA</span>
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Real-time threat investigation, automated IOC extraction, and multi-vendor intelligence telemetry at your fingertips.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              render={<Link href="/threats" />}
              className="bg-gradient-to-r from-cyber-cyan to-cyber-blue text-white font-bold px-5 h-11 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all group"
            >
              Start Investigation
              <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat: { label: string; value: string; change: string; icon: React.ElementType; color: string }) => (
          <Card
            key={stat.label}
            className="bg-card/50 border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
          >
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-extrabold font-mono mt-1 group-hover:text-primary transition-colors">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-background/60 border border-border/40 ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 mt-3 text-[11px] font-mono">
                  <TrendingUp
                    className={`w-3.5 h-3.5 ${
                      stat.change.startsWith("+") ? "text-status-success" : "text-status-error"
                    }`}
                  />
                  <span
                    className={`font-semibold ${
                      stat.change.startsWith("+") ? "text-status-success" : "text-status-error"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground ml-1">vs last week</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Quick Workflows
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="bg-card/50 border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group h-full">
                <CardContent className="pt-5 pb-5 flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0`}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                        {action.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                        {action.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main Grid — Threat Score Gauge + Threat Trends */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Threat Score Gauge */}
        <Card className="bg-card/50 border-border/50 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Aggregate Threat Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <ThreatScoreGauge score={statsData?.threatScore || 0} />
          </CardContent>
        </Card>

        {/* Threat Trends Chart */}
        <Card className="bg-card/50 border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Threat Trends
              <Badge variant="secondary" className="ml-auto text-xs font-mono">
                Last 7 days
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThreatTrendsChart data={statsData?.trendData || []} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Secondary Grid — Distribution + Investigations */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Risk Distribution */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Risk Classification Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart data={statsData?.riskDistribution || []} />
          </CardContent>
        </Card>

        {/* Recent Investigations */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Recent Investigations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentInvestigations data={statsData?.recentSearches || []} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Latest CVEs */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-severity-critical" />
              Latest High & Critical CVEs
              <Badge variant="secondary" className="ml-auto text-xs font-mono">
                NVD Feed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LatestCVEs data={cvesData || []} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
