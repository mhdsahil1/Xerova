"use client";

import React from "react";
import { Zap, ShieldCheck, Cpu, Activity } from "lucide-react";

const METRICS = [
  {
    icon: Activity,
    value: "22+",
    label: "Integrated Cyber Engines",
    subtext: "VirusTotal, AlienVault, NVD, URLScan, AbuseIPDB, Shodan & more",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Zap,
    value: "< 120ms",
    label: "IOC Triage Latency",
    subtext: "Sub-second simultaneous correlation across global threat registries",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: ShieldCheck,
    value: "100%",
    label: "Anti-Quishing Coverage",
    subtext: "Automated QR decode, unshortening hops, and homoglyph defense",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Cpu,
    value: "0–100",
    label: "Unified Threat Score",
    subtext: "Standardized risk scoring with automated MITRE ATT&CK tactic tagging",
    color: "from-rose-500 to-amber-500",
  },
];

export function ImpactMetrics() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {METRICS.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="relative p-6 rounded-2xl sm:rounded-3xl border border-[#17313A] bg-[#091820]/80 backdrop-blur-xl hover:border-[#00D9E8]/40 transition-all duration-300 shadow-xs flex flex-col justify-between group overflow-hidden"
              >
                {/* Subtle corner glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D9E8]/5 rounded-full blur-2xl group-hover:bg-[#00D9E8]/10 transition-colors pointer-events-none" />

                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#050B10] border border-[#17313A] flex items-center justify-center text-[#00D9E8] group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-[#00D9E8]" />
                  </div>

                  <div>
                    <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#00D9E8]">
                      {metric.value}
                    </div>
                    <div className="text-sm font-semibold text-[#F1F5F9] mt-1">
                      {metric.label}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#17313A] text-xs text-[#94A3B8] leading-relaxed">
                  {metric.subtext}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ImpactMetrics;
