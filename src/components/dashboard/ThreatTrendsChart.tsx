"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";

export interface ThreatTrendsChartProps {
  data: {
    date: string;
    investigations: number;
    threats: number;
  }[];
}

export function ThreatTrendsChart({ data }: ThreatTrendsChartProps) {
  const chartTheme = useChartTheme();

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorInvestigations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 2"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#717888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#717888"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#181b24",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              fontSize: "11px",
              color: "#ffffff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          />
          <Area
            type="natural"
            dataKey="investigations"
            stroke="#a78bfa"
            fillOpacity={1}
            fill="url(#colorInvestigations)"
            strokeWidth={2.5}
          />
          <Area
            type="natural"
            dataKey="threats"
            stroke="#00f0ff"
            fillOpacity={1}
            fill="url(#colorThreats)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ThreatTrendsChart;
