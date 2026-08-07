"use client";

import { motion } from "framer-motion";
import { getRiskLabel, getRiskColor } from "@/lib/utils";

interface ThreatScoreGaugeProps {
  score: number;
}

export function ThreatScoreGauge({ score }: ThreatScoreGaugeProps) {
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const label = getRiskLabel(score);
  const colorClass = getRiskColor(score);

  // Map to actual stroke color
  const strokeColor =
    score >= 80
      ? "#ef4444"
      : score >= 60
        ? "#f97316"
        : score >= 40
          ? "#eab308"
          : score >= 20
            ? "#3b82f6"
            : "#22c55e";

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative">
        <svg width={radius * 2} height={radius * 2} className="-rotate-90">
          {/* Background circle */}
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="text-muted/30"
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
            style={{
              strokeDasharray: circumference,
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            className="drop-shadow-lg"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`text-4xl font-bold ${colorClass}`}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            / 100
          </span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-center"
      >
        <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
        <p className="text-xs text-muted-foreground mt-1">
          Aggregate threat level
        </p>
      </motion.div>
    </div>
  );
}
