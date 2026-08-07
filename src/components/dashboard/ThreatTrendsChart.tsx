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

export interface ThreatTrendsChartProps {
  data: {
    date: string;
    investigations: number;
    threats: number;
  }[];
}

export function ThreatTrendsChart({ data }: ThreatTrendsChartProps) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorInvestigations" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="oklch(0.78 0.15 194)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="oklch(0.78 0.15 194)"
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="oklch(0.58 0.2 290)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="oklch(0.58 0.2 290)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.3 0.02 260)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="oklch(0.5 0.02 260)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="oklch(0.5 0.02 260)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "oklch(0.16 0.02 260)",
              border: "1px solid oklch(0.26 0.025 260)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "oklch(0.93 0.01 260)",
            }}
          />
          <Area
            type="monotone"
            dataKey="investigations"
            stroke="oklch(0.78 0.15 194)"
            fillOpacity={1}
            fill="url(#colorInvestigations)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="threats"
            stroke="oklch(0.58 0.2 290)"
            fillOpacity={1}
            fill="url(#colorThreats)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
