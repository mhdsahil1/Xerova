"use client";

import React from "react";
import { Radio } from "lucide-react";

const ENGINES = [
  { name: "VirusTotal", role: "70+ Antivirus Engines", status: "Live Feed" },
  { name: "AlienVault OTX", role: "Global Threat Pulses", status: "Live Feed" },
  { name: "NIST NVD", role: "CVSS v3.1 Vulnerabilities", status: "Synchronized" },
  { name: "URLScan.io", role: "DOM & Network Sandbox", status: "Automated" },
  { name: "Pulsedive", role: "Indicator Risk Scoring", status: "Live Feed" },
  { name: "AbuseIPDB", role: "IP Reputation & Reports", status: "Active" },
  { name: "Shodan", role: "Exposed Port & Service Recon", status: "Live Recon" },
  { name: "MITRE ATT&CK", role: "Tactics & Techniques v14", status: "Mapped" },
  { name: "CISA KEV", role: "Exploited Vulnerability Catalog", status: "Synchronized" },
  { name: "NewsData.io", role: "Live Cyber & Breach Feeds", status: "Cached Stream" },
  { name: "Google Safe Browsing", role: "Phishing & Malware List", status: "Active" },
  { name: "Google Gemini 1.5", role: "Autonomous Threat Reasoning", status: "AI Copilot" },
  { name: "Groq LLaMA 3", role: "Ultra-Fast Playbook Generation", status: "AI Copilot" },
];

export function EngineMarquee() {
  return (
    <section id="telemetry" className="py-12 border-y border-[#17313A] bg-[#091820]/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A] mb-3">
          <Radio className="w-3.5 h-3.5" />
          <span>NORMALIZED CYBERSECURITY TELEMETRY</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#F1F5F9] tracking-tight">
          Powered by 22+ Integrated Threat Intelligence Engines
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#94A3B8] max-w-2xl mx-auto">
          XEROVA aggregates, deduplicates, and normalizes telemetry from the world&apos;s leading threat
          databases into one cohesive threat score.
        </p>
      </div>

      {/* Marquee Row */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex gap-3 sm:gap-4 w-max animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused]">
          {[...ENGINES, ...ENGINES].map((engine, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#17313A] bg-[#091820]/80 backdrop-blur-md shrink-0 shadow-xs hover:border-[#00D9E8]/40 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-[#00D9E8] shrink-0 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#F1F5F9] font-sans">
                  {engine.name}
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  {engine.role}
                </span>
              </div>
              <span className="ml-2 text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#050B10] text-[#94A3B8] border border-[#17313A]">
                {engine.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

export default EngineMarquee;
