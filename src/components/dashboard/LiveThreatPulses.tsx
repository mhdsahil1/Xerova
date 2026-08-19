"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, Tag, Calendar, User, ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export interface PulseItem {
  id: string;
  name: string;
  description: string;
  author: string;
  tags: string[];
  adversary?: string | null;
  targetedCountries?: string[];
  malwareFamilies?: string[];
  indicatorCount: number;
  created: string;
  references?: string[];
}

export interface LiveThreatPulsesProps {
  data: PulseItem[];
}

const TILT_MAX = 8;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

function PulseSpotlightCard({
  pulse,
  dimmed,
  onHoverStart,
  onHoverEnd,
}: {
  pulse: PulseItem;
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

  const accentColor = pulse.adversary ? "#f43f5e" : "#00f0ff";

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
      className="group relative p-4 rounded-2xl bg-[#14161f] border border-white/[0.08] hover:border-white/20 transition-[border-color] duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
    >
      {/* Static accent tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${accentColor}12, transparent 65%)`,
        }}
      />

      {/* Dynamic Cursor-Tracking Hover Glow */}
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
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Card Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-primary/30 text-primary bg-primary/10 shrink-0"
              >
                <Activity className="w-2.5 h-2.5 mr-1 animate-pulse" />
                OTX Pulse
              </Badge>
              {pulse.adversary && (
                <Badge variant="destructive" className="text-[9px] uppercase tracking-wider font-semibold">
                  {pulse.adversary}
                </Badge>
              )}
              {pulse.indicatorCount > 0 && (
                <span className="text-[10px] font-mono text-[#8a8f9d] px-1.5 py-0.2 rounded bg-white/[0.04]">
                  {pulse.indicatorCount} IOCs
                </span>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-primary transition-colors line-clamp-1" title={pulse.name}>
              {pulse.name}
            </h4>
          </div>
          <Link
            href={`/threats?query=${encodeURIComponent(pulse.name)}`}
            className="text-[#8a8f9d] hover:text-white transition-colors shrink-0 mt-0.5"
            title="Investigate in Threats"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pulse.description && (
          <p className="text-xs text-[#8a8f9d] line-clamp-2 mb-3 leading-relaxed">
            {pulse.description}
          </p>
        )}

        {/* Tags */}
        {pulse.tags && pulse.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {pulse.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-[#8a8f9d]"
              >
                <Tag className="w-2.5 h-2.5 mr-1 opacity-60" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-[10px] text-[#8a8f9d]">
        <span className="flex items-center gap-1 truncate max-w-[140px]">
          <User className="w-3 h-3 text-[#8a8f9d] shrink-0" />
          {pulse.author}
        </span>
        <span className="flex items-center gap-1 font-mono">
          <Calendar className="w-3 h-3 text-[#8a8f9d] shrink-0" />
          {pulse.created}
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

export function LiveThreatPulses({ data }: LiveThreatPulsesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#8a8f9d] font-mono bg-white/[0.02] rounded-xl border border-white/[0.06]">
        No active global threat pulses retrieved from AlienVault OTX.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {data.slice(0, 4).map((pulse) => (
        <PulseSpotlightCard
          key={pulse.id}
          pulse={pulse}
          dimmed={hoveredId !== null && hoveredId !== pulse.id}
          onHoverStart={() => setHoveredId(pulse.id)}
          onHoverEnd={() => setHoveredId(null)}
        />
      ))}
    </div>
  );
}

export default LiveThreatPulses;
