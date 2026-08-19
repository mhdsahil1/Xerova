"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useChartTheme } from "@/hooks/use-chart-theme";
import { Activity } from "lucide-react";

export interface RiskDistributionChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, theme }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-xl text-xs font-medium"
      style={{
        backgroundColor: theme.tooltipBg,
        border: `1px solid ${theme.tooltipBorder}`,
        color: theme.tooltipText,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.payload?.color || item.color }}
        />
        <span className="capitalize text-foreground">{item.name}:</span>
        <span className="font-bold font-mono" style={{ color: item.payload?.color || item.color }}>
          {item.value}
        </span>
      </div>
    </div>
  );
}

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const chartTheme = useChartTheme();
  const total = data?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="h-[200px] w-full flex flex-col items-center justify-center gap-3">
        <Activity className="w-10 h-10 text-muted-foreground/20" />
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">No distribution data</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Threat classifications will appear after investigations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="h-[200px] w-[200px] flex-shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip theme={chartTheme} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono">{total}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
        </div>
      </div>
      <div className="space-y-2.5 flex-1 w-full sm:w-auto">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-2 rounded-lg bg-background/30 border border-border/30 hover:border-border/60 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-medium text-muted-foreground capitalize">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-foreground">{item.value}</span>
              <span className="text-[11px] text-muted-foreground font-mono">
                ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

