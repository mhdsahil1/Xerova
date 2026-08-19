"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { TrendingUp } from "lucide-react";

export interface ThreatTrendsChartProps {
  data: {
    date: string;
    investigations: number;
    threats: number;
  }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, theme }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2.5 shadow-xl text-xs"
      style={{
        backgroundColor: theme.tooltipBg,
        border: `1px solid ${theme.tooltipBorder}`,
        color: theme.tooltipText,
      }}
    >
      <p className="font-bold mb-1.5 font-mono">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.stroke }}
          />
          <span className="capitalize text-muted-foreground">{entry.name}:</span>
          <span className="font-bold" style={{ color: entry.stroke }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ThreatTrendsChart({ data }: ThreatTrendsChartProps) {
  const chartTheme = useChartTheme();
  const hasData = data && data.length > 0 && data.some((d) => d.investigations > 0 || d.threats > 0);

  if (!hasData) {
    return (
      <div className="h-[260px] w-full flex flex-col items-center justify-center gap-3">
        <TrendingUp className="w-10 h-10 text-muted-foreground/20" />
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Run your first threat investigation to see trends here.
          </p>
        </div>
      </div>
    );
  }

  const cyberCyan = "oklch(0.78 0.15 194)";
  const cyberPurple = "oklch(0.58 0.2 290)";

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="gradInvestigations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cyberCyan} stopOpacity={0.35} />
              <stop offset="100%" stopColor={cyberCyan} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradThreats" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cyberPurple} stopOpacity={0.35} />
              <stop offset="100%" stopColor={cyberPurple} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke={chartTheme.axisColor}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartTheme.axisColor }}
          />
          <YAxis
            stroke={chartTheme.axisColor}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartTheme.axisColor }}
            allowDecimals={false}
          />
          <Tooltip
            content={<CustomTooltip theme={chartTheme} />}
            cursor={{ stroke: chartTheme.gridColor, strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            formatter={(value) => (
              <span style={{ color: chartTheme.axisColor, textTransform: "capitalize" }}>
                {value}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="investigations"
            name="investigations"
            stroke={cyberCyan}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradInvestigations)"
            dot={false}
            activeDot={{ r: 4, fill: cyberCyan, stroke: chartTheme.tooltipBg, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="threats"
            name="threats"
            stroke={cyberPurple}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradThreats)"
            dot={false}
            activeDot={{ r: 4, fill: cyberPurple, stroke: chartTheme.tooltipBg, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
