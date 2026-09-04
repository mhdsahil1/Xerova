"use client";

import { motion } from "framer-motion";
import { getRiskColor } from "@/lib/utils";

interface ThreatScoreGaugeProps {
  score: number;
}

export function ThreatScoreGauge({ score }: ThreatScoreGaugeProps) {
  const radius = 42;
  const strokeWidth = 5.5;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorClass = getRiskColor(score);

  const strokeColor =
    score >= 75
      ? "#f43f5e"
      : score >= 40
      ? "#f59e0b"
      : "#34d399";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={radius * 2} height={radius * 2} className="-rotate-90" aria-hidden="true">
        {/* Track circle */}
        <circle
          className="stroke-border"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Score indicator arc */}
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
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      {/* Center percentage label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className={`text-base font-extrabold font-mono ${colorClass}`}
        >
          {score}%
        </motion.span>
      </div>
    </div>
  );
}

export default ThreatScoreGauge;
