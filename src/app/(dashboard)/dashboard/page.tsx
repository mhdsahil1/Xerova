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
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    description: "Search IPs, domains, hashes, CVEs",
    icon: Search,
    href: "/threats",
    gradient: "from-cyber-cyan to-cyber-blue",
  },
  {
    title: "AI Assistant",
    description: "Ask security questions",
    icon: MessageSquare,
    href: "/assistant",
    gradient: "from-cyber-purple to-cyber-blue",
  },
  {
    title: "New Report",
    description: "Create investigation report",
    icon: FileText,
    href: "/reports",
    gradient: "from-cyber-green to-cyber-teal",
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statsData, setStatsData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cvesData, setCvesData] = useState<any>(null);

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
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground mt-4">Loading dashboard data...</p>
      </div>
    );
  }

  const defaultStats = [
    { label: "Investigations", value: "0", change: "0%", icon: Activity, color: "text-cyber-cyan" },
    { label: "Critical Threats", value: "0", change: "0%", icon: AlertTriangle, color: "text-severity-critical" },
    { label: "Reports Generated", value: "0", change: "0%", icon: FileText, color: "text-cyber-purple" },
    { label: "Avg Risk Score", value: "0", change: "", icon: Globe, color: "text-cyber-green" },
  ];

  const stats = statsData?.stats?.map((s: { label: string; value: string; change: string }, i: number) => ({
    ...s,
    icon: defaultStats[i].icon,
    color: defaultStats[i].color,
  })) || defaultStats;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="text-gradient">Analyst</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your security overview for today
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat: { label: string; value: string; change: string; icon: React.ElementType; color: string }) => (
          <Card
            key={stat.label}
            className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div
                  className={`p-3 rounded-xl bg-background/50 ${stat.color}`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 mt-3">
                  <TrendingUp
                    className={`w-3 h-3 ${
                      stat.change.startsWith("+")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      stat.change.startsWith("+")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    vs last week
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group h-full">
                <CardContent className="pt-6 flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {action.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Main Grid — Charts + Threat Score */}
      <motion.div
        variants={fadeInUp}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Threat Score Gauge */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Threat Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThreatScoreGauge score={statsData?.threatScore || 0} />
          </CardContent>
        </Card>

        {/* Threat Trends */}
        <Card className="bg-card/50 border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Threat Trends
              <Badge variant="secondary" className="ml-auto text-xs">
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
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart data={statsData?.riskDistribution || []} />
          </CardContent>
        </Card>

        {/* Recent Investigations */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
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
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-severity-critical" />
              Latest CVEs
              <Badge variant="secondary" className="ml-auto text-xs">
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
