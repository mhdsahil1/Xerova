"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface RiskDistributionChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex items-center gap-6">
      <div className="h-[200px] w-[200px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.16 0.02 260)",
                border: "1px solid oklch(0.26 0.025 260)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "oklch(0.93 0.01 260)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 flex-1">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{item.value}</span>
              <span className="text-xs text-muted-foreground">
                ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
