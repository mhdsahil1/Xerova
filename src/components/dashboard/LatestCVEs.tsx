"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getSeverityColor } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export interface LatestCVEsProps {
  data: {
    id: string;
    title: string;
    severity: string;
    cvss: number;
    published: string;
    description: string;
  }[];
}

const TILT_MAX = 8;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

function getSeverityHex(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "#f43f5e";
    case "high":
      return "#fb923c";
    case "medium":
      return "#facc15";
    case "low":
      return "#60a5fa";
    default:
      return "#38bdf8";
  }
}

function CVESpotlightCard({
  cve,
  dimmed,
  onHoverStart,
  onHoverEnd,
}: {
  cve: LatestCVEsProps["data"][0];
  dimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
  };

  const accentColor = getSeverityHex(cve.severity);

  return (
    <motion.div
      ref={cardRef}
      animate={{
        scale: dimmed ? 0.96 : 1,
        opacity: dimmed ? 0.5 : 1,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className="group relative p-4 rounded-2xl bg-card/90 border border-border hover:border-border/80 transition-[border-color] duration-300 flex flex-col justify-between overflow-hidden shadow-lg text-card-foreground"
    >
      {/* Static Accent Tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${accentColor}12, transparent 65%)`,
        }}
      />

      {/* Dynamic Cursor-Tracking Glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${accentColor}28, transparent 65%)`,
        }}
      />

      {/* Shimmer Sweep Animation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Card Body */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <Link
              href={`/threats?query=${encodeURIComponent(cve.id)}&type=cve`}
              className="text-xs font-mono font-bold text-primary hover:underline block"
            >
              {cve.id}
            </Link>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mt-0.5 line-clamp-1">
              {cve.title}
            </h4>
          </div>
          <Link
            href={`/threats?query=${encodeURIComponent(cve.id)}&type=cve`}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            title="Lookup CVE"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {cve.description}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-2 pt-2.5 border-t border-border text-[10px]">
        <Badge
          className={`text-[9px] font-mono capitalize border ${getSeverityColor(cve.severity)}`}
          variant="outline"
        >
          {cve.severity}
        </Badge>
        <span className="font-mono text-foreground font-semibold px-2 py-0.5 rounded bg-muted/60">
          CVSS {cve.cvss}
        </span>
        <span className="text-muted-foreground font-mono ml-auto">
          {cve.published}
        </span>
      </div>

      {/* Accent Bottom Glow Line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${accentColor}cc, transparent)`,
        }}
      />
    </motion.div>
  );
}

export function LatestCVEs({ data }: LatestCVEsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground font-mono bg-muted/20 rounded-xl border border-border">
        No recent CVEs found from National Vulnerability Database.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {data.slice(0, 4).map((cve) => (
        <CVESpotlightCard
          key={cve.id}
          cve={cve}
          dimmed={hoveredId !== null && hoveredId !== cve.id}
          onHoverStart={() => setHoveredId(cve.id)}
          onHoverEnd={() => setHoveredId(null)}
        />
      ))}
    </div>
  );
}

export default LatestCVEs;
