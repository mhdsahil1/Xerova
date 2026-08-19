"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

type VendorVerdict = "clean" | "suspicious" | "malicious" | "unknown";

interface ThreatSourceCardProps {
  name: string;
  verdict: VendorVerdict;
  stat?: string;
  statLabel?: string;
  detail?: string;
  index?: number;
}

const verdictConfig = {
  clean: {
    bg: "bg-status-success/5 border-status-success/25",
    badge: "bg-status-success/15 text-status-success border-status-success/30",
    icon: CheckCircle2,
    iconColor: "text-status-success",
    label: "Clean",
  },
  suspicious: {
    bg: "bg-severity-medium/5 border-severity-medium/25",
    badge: "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
    icon: AlertTriangle,
    iconColor: "text-severity-medium",
    label: "Suspicious",
  },
  malicious: {
    bg: "bg-severity-critical/5 border-severity-critical/25",
    badge: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
    icon: XCircle,
    iconColor: "text-severity-critical",
    label: "Malicious",
  },
  unknown: {
    bg: "bg-muted/20 border-border/40",
    badge: "bg-muted/40 text-muted-foreground border-border/40",
    icon: HelpCircle,
    iconColor: "text-muted-foreground",
    label: "Unknown",
  },
};

// Source-specific display names and subtitles
const sourceInfo: Record<string, { subtitle: string }> = {
  "VirusTotal": { subtitle: "94 AV Engines" },
  "AbuseIPDB": { subtitle: "Community Reports" },
  "Shodan": { subtitle: "Device Intelligence" },
  "URLScan.io": { subtitle: "URL Scanner" },
  "OpenPhish": { subtitle: "Phishing Database" },
  "Local Heuristics": { subtitle: "Pattern Analysis" },
};

export function ThreatSourceCard({
  name,
  verdict,
  stat,
  statLabel,
  detail,
  index = 0,
}: ThreatSourceCardProps) {
  const config = verdictConfig[verdict] || verdictConfig.unknown;
  const Icon = config.icon;
  const info = sourceInfo[name];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.07 }}
      className={`p-4 rounded-xl border ${config.bg} flex flex-col gap-3 hover:scale-[1.01] transition-transform`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">{name}</p>
          {info && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {info.subtitle}
            </p>
          )}
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide shrink-0 ${config.badge}`}
        >
          <Icon className={`w-3 h-3 ${config.iconColor}`} />
          {config.label}
        </div>
      </div>

      {/* Stat */}
      {stat && (
        <div>
          <p className={`text-xl font-black font-mono ${config.iconColor}`}>{stat}</p>
          {statLabel && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{statLabel}</p>
          )}
        </div>
      )}

      {/* Detail text */}
      {detail && (
        <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/30 pt-2">
          {detail}
        </p>
      )}
    </motion.div>
  );
}
