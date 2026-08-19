"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

const SCAN_STEPS = [
  { label: "Parsing URL structure & entropy", duration: 600 },
  { label: "Querying VirusTotal engine", duration: 1100 },
  { label: "Checking AbuseIPDB reputation", duration: 900 },
  { label: "Running heuristic analysis", duration: 700 },
  { label: "Aggregating risk score", duration: 500 },
];

interface ScanningAnimationProps {
  query?: string;
  type?: string;
}

const typeLabels: Record<string, string> = {
  url: "URL",
  ip: "IP Address",
  domain: "Domain",
  hash: "File Hash",
  cve: "Vulnerability",
};

export function ScanningAnimation({ query, type }: ScanningAnimationProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setCompletedSteps([]);
    setCurrentStep(0);

    let elapsed = 0;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    SCAN_STEPS.forEach((step, i) => {
      // Mark as in-progress
      const t1 = setTimeout(() => setCurrentStep(i), elapsed);
      elapsed += step.duration;
      // Mark as complete
      const t2 = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
      }, elapsed);
      timeouts.push(t1, t2);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [query]);

  const typeLabel = type ? typeLabels[type] || type.toUpperCase() : "Target";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center py-12 px-4 gap-8"
    >
      {/* Radar animation */}
      <div className="relative flex items-center justify-center" aria-hidden="true">
        {/* Pulsing rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-primary/30"
            style={{ width: 48 * i, height: 48 * i }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{
              duration: 2,
              delay: i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        {/* Center shield icon */}
        <div className="relative w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-primary"
          />
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary fill-current" aria-hidden>
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
        </div>
      </div>

      {/* Query label */}
      {query && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Analyzing {typeLabel}
          </p>
          <p className="text-sm font-mono text-foreground max-w-sm truncate font-semibold">
            {query}
          </p>
        </div>
      )}

      {/* Step list */}
      <div className="w-full max-w-sm space-y-2">
        {SCAN_STEPS.map((step, i) => {
          const isDone = completedSteps.includes(i);
          const isActive = currentStep === i && !isDone;

          return (
            <AnimatePresence key={i} mode="wait">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  isDone
                    ? "bg-status-success/5 border border-status-success/20"
                    : isActive
                    ? "bg-primary/5 border border-primary/20"
                    : "border border-transparent"
                }`}
              >
                <div className="shrink-0">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    </motion.div>
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border/50" />
                  )}
                </div>
                <span
                  className={`text-xs ${
                    isDone
                      ? "text-status-success"
                      : isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-cyber-cyan rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width: `${Math.round((completedSteps.length / SCAN_STEPS.length) * 100)}%`,
            }}
            transition={{ ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
          {completedSteps.length < SCAN_STEPS.length
            ? "Gathering threat intelligence across global sources..."
            : "Finalizing analysis..."}
        </p>
      </div>
    </motion.div>
  );
}
