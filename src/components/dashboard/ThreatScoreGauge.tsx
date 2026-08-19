"use client";

import { motion } from "framer-motion";
import { getRiskLabel, getRiskColor } from "@/lib/utils";
import { useChartTheme } from "@/hooks/use-chart-theme";

interface ThreatScoreGaugeProps {
  score: number;
}

export function ThreatScoreGauge({ score }: ThreatScoreGaugeProps) {
  const chartTheme = useChartTheme();
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const label = getRiskLabel(score);
  const colorClass = getRiskColor(score);

  // Map score to proper severity color
  const strokeColor =
    score >= 75
      ? chartTheme.severityCritical
      : score >= 50
      ? chartTheme.severityHigh
      : score >= 25
      ? chartTheme.severityMedium
      : score >= 1
      ? chartTheme.severityLow
      : chartTheme.severityInfo;

  // Severity zone tick positions (at 25%, 50%, 75% of the arc)
  const ticks = [25, 50, 75].map((pct) => {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    const outer = normalizedRadius + strokeWidth / 2 + 4;
    const inner = normalizedRadius - strokeWidth / 2 - 2;
    return {
      x1: radius + inner * Math.cos(angle),
      y1: radius + inner * Math.sin(angle),
      x2: radius + outer * Math.cos(angle),
      y2: radius + outer * Math.sin(angle),
    };
  });

  // Severity labels around the gauge
  const severityLabels = [
    { pct: 12.5, label: "Low" },
    { pct: 37.5, label: "Med" },
    { pct: 62.5, label: "High" },
    { pct: 87.5, label: "Crit" },
  ].map(({ pct, label }) => {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    const r = normalizedRadius + strokeWidth / 2 + 16;
    return { x: radius + r * Math.cos(angle), y: radius + r * Math.sin(angle), label };
  });

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative">
        <svg
          width={radius * 2 + 40}
          height={radius * 2 + 40}
          viewBox={`-20 -20 ${radius * 2 + 40} ${radius * 2 + 40}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-muted/25"
          />

          {/* Score arc */}
          <motion.circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ strokeDasharray: circumference }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            className="drop-shadow-md"
          />

          {/* Tick marks at severity boundaries */}
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-muted/50"
            />
          ))}
        </svg>

        {/* Severity labels (not rotated) */}
        <svg
          className="absolute inset-0"
          width={radius * 2 + 40}
          height={radius * 2 + 40}
          viewBox={`-20 -20 ${radius * 2 + 40} ${radius * 2 + 40}`}
          aria-hidden="true"
        >
          {severityLabels.map(({ x, y, label: slabel }) => (
            <text
              key={slabel}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="currentColor"
              className="text-muted-foreground/50 font-mono"
            >
              {slabel}
            </text>
          ))}
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`text-4xl font-bold ${colorClass} tabular-nums`}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">/ 100</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-center"
      >
        <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
        <p className="text-xs text-muted-foreground mt-1">Aggregate threat level</p>
      </motion.div>
    </div>
  );
}
