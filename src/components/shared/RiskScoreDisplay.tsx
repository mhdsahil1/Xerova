"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";
import { getRiskColor, getRiskLabel, getRiskBgColor } from "@/lib/utils";

interface RiskScoreDisplayProps {
  score?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showBar?: boolean;
  showExplanation?: boolean;
  className?: string;
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    if (typeof target !== "number" || isNaN(target)) {
      setValue(0);
      return;
    }

    const safeTarget = Math.min(100, Math.max(0, Math.round(target)));
    if (safeTarget === 0) {
      setValue(0);
      return;
    }

    start.current = null;
    const step = (timestamp: number) => {
      if (!start.current) start.current = timestamp;
      const elapsed = timestamp - start.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * safeTarget));
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      }
    };
    raf.current = requestAnimationFrame(step);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

const explanations: Record<string, string> = {
  "Critical Risk": "High confidence of malicious activity. Block access and investigate immediately.",
  "High Risk": "Strong indicators of suspicious or harmful behavior. Avoid interaction.",
  "Medium Risk": "Some suspicious signals detected. Proceed with caution and verify before use.",
  "Low Risk": "Minor concerns detected. Generally safe but worth monitoring.",
  "Clean": "No threat indicators found. This target appears to be safe.",
};

const barColors: Record<string, string> = {
  "Critical Risk": "bg-severity-critical",
  "High Risk": "bg-severity-high",
  "Medium Risk": "bg-severity-medium",
  "Low Risk": "bg-severity-low",
  "Clean": "bg-status-success",
};

const sizeConfig = {
  sm: { score: "text-3xl", label: "text-xs", bar: "h-1.5" },
  md: { score: "text-5xl", label: "text-sm", bar: "h-2" },
  lg: { score: "text-6xl md:text-7xl", label: "text-sm md:text-base", bar: "h-2.5 md:h-3" },
};

export function RiskScoreDisplay({
  score = 0,
  size = "md",
  showLabel = true,
  showBar = true,
  showExplanation = false,
  className = "",
}: RiskScoreDisplayProps) {
  const safeScore = typeof score === "number" && !isNaN(score) ? Math.min(100, Math.max(0, Math.round(score))) : 0;
  const animated = useCountUp(safeScore);
  const label = getRiskLabel(safeScore);
  const colorClass = getRiskColor(safeScore);
  const bgColor = getRiskBgColor(safeScore);
  const barColor = barColors[label] || "bg-status-success";
  const sizes = sizeConfig[size] || sizeConfig.md;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      role="meter"
      aria-valuenow={safeScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Risk Score: ${safeScore} out of 100, ${label}`}
    >
      {/* Animated Numeric Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-baseline"
      >
        <span className={`font-black font-mono tracking-tight ${sizes.score} ${colorClass} tabular-nums`}>
          {animated}
        </span>
        <span className="text-muted-foreground font-mono text-xs md:text-sm ml-1 font-semibold">
          /100
        </span>
      </motion.div>

      {/* Label and Explanatory Tooltip */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-1.5 relative"
        >
          <span className={`${sizes.label} font-bold uppercase tracking-wider ${colorClass}`}>
            {label}
          </span>
          {showExplanation && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="What does this risk score mean?"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 2, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 rounded-xl border text-xs leading-relaxed ${bgColor} shadow-2xl backdrop-blur-md pointer-events-none text-foreground font-normal`}
                  >
                    {explanations[label] || "Assessment based on threat intelligence and heuristics."}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-border/40 rotate-45 -mt-1 bg-inherit" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* Animated Gauge Bar */}
      {showBar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full"
        >
          <div className={`w-full bg-muted/40 rounded-full ${sizes.bar} overflow-hidden shadow-inner`}>
            <motion.div
              className={`${sizes.bar} rounded-full ${barColor} shadow-sm`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(3, safeScore)}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
