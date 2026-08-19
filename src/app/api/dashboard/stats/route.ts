// ============================================
// XEROVA — Dashboard Stats API Route
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ThreatSearch from "@/models/ThreatSearch";
import Report from "@/models/Report";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60_000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60_000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60_000);

    // Run all DB queries in parallel
    const [
      totalSearches,
      previousWeekSearches,
      severityAgg,
      trendAgg,
      reportsCount,
      previousReportsCount,
      recentSearches,
      criticalCount,
      previousCriticalCount,
    ] = await Promise.all([
      // Total searches (last 30 days)
      ThreatSearch.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
      }),

      // Previous week searches (for comparison)
      ThreatSearch.countDocuments({
        userId,
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),

      // Severity distribution
      ThreatSearch.aggregate([
        { $match: { userId: userId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),

      // Trend data (last 7 days, grouped by day)
      ThreatSearch.aggregate([
        { $match: { userId: userId, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            investigations: { $sum: 1 },
            threats: {
              $sum: {
                $cond: [
                  { $in: ["$severity", ["critical", "high"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Reports count
      Report.countDocuments({ userId }),

      // Previous period reports
      Report.countDocuments({
        userId,
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),

      // Recent searches (last 10)
      ThreatSearch.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("query type severity riskScore createdAt")
        .lean(),

      // Critical threats this week
      ThreatSearch.countDocuments({
        userId,
        severity: { $in: ["critical", "high"] },
        createdAt: { $gte: sevenDaysAgo },
      }),

      // Critical threats previous week
      ThreatSearch.countDocuments({
        userId,
        severity: { $in: ["critical", "high"] },
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      }),
    ]);

    // Current week searches
    const thisWeekSearches = await ThreatSearch.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    // Build severity distribution
    const severityMap: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const s of severityAgg) {
      if (s._id && severityMap.hasOwnProperty(s._id)) {
        severityMap[s._id] = s.count;
      }
    }

    const riskDistribution = [
      { name: "Critical", value: severityMap.critical, color: "#ef4444" },
      { name: "High", value: severityMap.high, color: "#f97316" },
      { name: "Medium", value: severityMap.medium, color: "#eab308" },
      { name: "Low", value: severityMap.low, color: "#3b82f6" },
      { name: "Info", value: severityMap.info, color: "#22c55e" },
    ];

    // Build trend data (fill missing days)
    const trendData: { date: string; investigations: number; threats: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60_000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const found = trendAgg.find(
        (t: { _id: string; investigations: number; threats: number }) =>
          t._id === dateStr
      );
      trendData.push({
        date: dayName,
        investigations: found?.investigations ?? 0,
        threats: found?.threats ?? 0,
      });
    }

    // Compute average risk score
    const avgRiskAgg = await ThreatSearch.aggregate([
      { $match: { userId: userId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, avg: { $avg: "$riskScore" } } },
    ]);
    const avgRiskScore = Math.round(avgRiskAgg[0]?.avg ?? 0);

    // Helper for percent change
    function pctChange(current: number, previous: number): string {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const pct = Math.round(((current - previous) / previous) * 100);
      return `${pct >= 0 ? "+" : ""}${pct}%`;
    }

    // Format recent searches
    const formattedRecent = recentSearches.map(
      (s: {
        _id: unknown;
        query: string;
        type: string;
        severity: string;
        riskScore: number;
        createdAt: Date;
      }) => {
        const diff = now.getTime() - new Date(s.createdAt).getTime();
        const mins = Math.floor(diff / 60_000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        let dateStr = "just now";
        if (days > 0) dateStr = `${days}d ago`;
        else if (hours > 0) dateStr = `${hours}h ago`;
        else if (mins > 0) dateStr = `${mins}m ago`;

        return {
          id: String(s._id),
          query: s.query,
          type: s.type,
          severity: s.severity,
          date: dateStr,
        };
      }
    );

    const reportsThisWeek = await Report.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    return NextResponse.json({
      stats: [
        {
          label: "Investigations",
          value: String(totalSearches),
          change: pctChange(thisWeekSearches, previousWeekSearches),
        },
        {
          label: "Critical Threats",
          value: String(criticalCount),
          change: pctChange(criticalCount, previousCriticalCount),
        },
        {
          label: "Reports Generated",
          value: String(reportsCount),
          change: pctChange(reportsThisWeek, previousReportsCount),
        },
        {
          label: "Avg Risk Score",
          value: String(avgRiskScore),
          change: "",
        },
      ],
      threatScore: avgRiskScore,
      riskDistribution,
      trendData,
      recentSearches: formattedRecent,
    });
  } catch (error) {
    console.error("[Dashboard Stats Error]:", error);
    // Return graceful fallback state so the dashboard still loads smoothly
    return NextResponse.json({
      stats: [
        { label: "Investigations", value: "0", change: "0%" },
        { label: "Critical Threats", value: "0", change: "0%" },
        { label: "Reports Generated", value: "0", change: "0%" },
        { label: "Avg Risk Score", value: "0", change: "" },
      ],
      threatScore: 0,
      riskDistribution: [
        { name: "Critical", value: 0, color: "#ef4444" },
        { name: "High", value: 0, color: "#f97316" },
        { name: "Medium", value: 0, color: "#eab308" },
        { name: "Low", value: 0, color: "#3b82f6" },
        { name: "Clean", value: 0, color: "#22c55e" },
      ],
      trendData: [
        { date: "Mon", investigations: 0, threats: 0 },
        { date: "Tue", investigations: 0, threats: 0 },
        { date: "Wed", investigations: 0, threats: 0 },
        { date: "Thu", investigations: 0, threats: 0 },
        { date: "Fri", investigations: 0, threats: 0 },
        { date: "Sat", investigations: 0, threats: 0 },
        { date: "Sun", investigations: 0, threats: 0 },
      ],
      recentSearches: [],
    });
  }
}
