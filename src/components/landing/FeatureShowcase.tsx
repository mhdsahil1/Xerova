"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  QrCode,
  Bot,
  Radio,
  ShieldAlert,
  FileText,
  ArrowRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Search,
    title: "Multi-Vector Threat Intelligence",
    badge: "22+ Providers",
    badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    description:
      "Investigate any IP, Domain, Hash, URL, or CVE through a single unified interface. Instantly pull ISP/ASN info, open ports, passive DNS, and multi-engine antivirus detection ratios.",
    link: "/threats",
    linkText: "Explore Threat Lookup",
    highlight: "Consolidated IP, Domain & Hash Telemetry",
  },
  {
    icon: QrCode,
    title: "Anti-Quishing & Deep URL Sandbox",
    badge: "Zero-Day Vector",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    description:
      "Defend against QR code phishing (quishing) with our real-time decoder and classifier. Unravel 10-hop redirect chains, uncover punycode homoglyphs, and detect brand impersonation.",
    link: "/threats",
    linkText: "Try Anti-Quishing Scanner",
    highlight: "Punycode & Levenshtein Brand Protection",
  },
  {
    icon: Bot,
    title: "Dual AI Security Copilot",
    badge: "Gemini + Groq",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    description:
      "Paste messy server logs, phishing headers, or incident notes. The copilot extracts IOCs in milliseconds, maps attacks to MITRE ATT&CK, and writes actionable containment playbooks.",
    link: "/assistant",
    linkText: "Meet the AI Copilot",
    highlight: "Autonomous IOC Extraction & Playbooks",
  },
  {
    icon: Radio,
    title: "Live Cyber News & Threat Pulses",
    badge: "15-Min Sync",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    description:
      "Stay ahead with continuously aggregated cyber news and AlienVault OTX pulses. Filter by Data Breaches, Ransomware, Zero-Day Vulnerabilities, and Emerging AI Security threats.",
    link: "/dashboard",
    linkText: "View Live News Stream",
    highlight: "Automated Breaches & Ransomware Alerts",
  },
  {
    icon: ShieldAlert,
    title: "Vulnerability & CVE Telemetry",
    badge: "NIST NVD Live",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    description:
      "Real-time CVE synchronization with NIST NVD and CISA Known Exploited Vulnerabilities. Inspect CVSS v3.1 vectors, affected CPE trees, and complete historical modification logs.",
    link: "/vulnerabilities",
    linkText: "Track Vulnerabilities",
    highlight: "CVSS v3.1 Scoring & Change Timelines",
  },
  {
    icon: FileText,
    title: "Executive Reports & Browser Guard",
    badge: "PDF / MD / JSON",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    description:
      "Turn hours of complex triage into boardroom-ready PDF dossiers with one click. Plus, use our Browser Guard extension to inspect live suspect sites in complete sandboxed safety.",
    link: "/reports",
    linkText: "View Incident Dossiers",
    highlight: "Tamper-Evident Incident Exporting",
  },
];

export function FeatureShowcase() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A] mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>ENTERPRISE SOC ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight">
            Engineered for Modern Security Operations
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Replace fragmented threat lookup tools with an integrated intelligence engine
            designed to accelerate detection, correlation, and response from hours to seconds.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl sm:rounded-3xl border border-[#17313A] bg-[#091820]/70 backdrop-blur-xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-[#00D9E8]/40 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
              >
                {/* Subtle top rim light */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D9E8]/20 to-transparent pointer-events-none" />

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#050B10] border border-[#17313A] flex items-center justify-center text-[#00D9E8] group-hover:scale-105 group-hover:bg-[#00D9E8]/10 transition-all">
                      <Icon className="w-6 h-6 text-[#00D9E8]" />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border",
                        feature.badgeColor
                      )}
                    >
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#F1F5F9] tracking-tight group-hover:text-[#00D9E8] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Highlight & Link */}
                <div className="mt-6 pt-4 border-t border-[#17313A] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#94A3B8] font-medium truncate max-w-[190px]">
                    {feature.highlight}
                  </span>
                  <Link
                    href={feature.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D9E8] hover:text-[#00D9E8]/80 transition-colors"
                  >
                    <span>{feature.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeatureShowcase;
