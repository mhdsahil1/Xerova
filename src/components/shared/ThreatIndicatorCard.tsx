"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, type LucideIcon } from "lucide-react";

interface ThreatIndicatorCardProps {
  label: string;
  detected: boolean;
  icon: LucideIcon;
  description?: string;
  detectedDescription?: string;
  index?: number;
}

export function ThreatIndicatorCard({
  label,
  detected,
  icon: Icon,
  description,
  detectedDescription,
  index = 0,
}: ThreatIndicatorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        detected
          ? "bg-severity-critical/5 border-severity-critical/25 hover:border-severity-critical/40"
          : "bg-status-success/5 border-status-success/20 hover:border-status-success/35"
      }`}
    >
      {/* Icon */}
      <div
        className={`p-2 rounded-lg shrink-0 ${
          detected ? "bg-severity-critical/10" : "bg-status-success/10"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${
            detected ? "text-severity-critical" : "text-status-success"
          }`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {detected ? (
            <div className="flex items-center gap-1 shrink-0">
              <XCircle className="w-3.5 h-3.5 text-severity-critical" />
              <span className="text-xs font-bold text-severity-critical uppercase tracking-wide">
                Detected
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
              <span className="text-xs font-bold text-status-success uppercase tracking-wide">
                Clean
              </span>
            </div>
          )}
        </div>
        {(description || detectedDescription) && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {detected && detectedDescription ? detectedDescription : description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
