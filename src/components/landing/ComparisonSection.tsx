"use client";

import React from "react";
import { Check, X, Sparkles, Zap } from "lucide-react";

const COMPARISON_ITEMS = [
  {
    feature: "Threat Telemetry Sources",
    traditional: "Fragmented across 8–15 browser tabs and logins",
    xerova: "22+ threat engines queried & normalized in one click",
  },
  {
    feature: "Average Triage Latency",
    traditional: "45 to 90 minutes per complex alert",
    xerova: "< 60 seconds from ingestion to containment",
  },
  {
    feature: "IOC Extraction",
    traditional: "Manual regex or copy-pasting line by line",
    xerova: "AI-powered instant parsing from raw logs or emails",
  },
  {
    feature: "Phishing & QR Quishing",
    traditional: "Manual phone scanning, risky live link visits",
    xerova: "Safe server-side QR decoding & unshortening sandbox",
  },
  {
    feature: "Homoglyph & Brand Defense",
    traditional: "Easily missed visually (e.g. Cyrillic 'а')",
    xerova: "Automated Punycode & Levenshtein distance matching",
  },
  {
    feature: "AI Reasoning & Playbooks",
    traditional: "Generic chatbots or manual playbook lookups",
    xerova: "Dual AI copilot (Gemini + Groq) with MITRE mappings",
  },
  {
    feature: "Incident Reporting",
    traditional: "Manual Word doc copy-paste, hours to format",
    xerova: "1-click boardroom-ready PDF, Markdown & JSON export",
  },
];

export function ComparisonSection() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A] mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>OPERATIONAL EFFICIENCY MATRIX</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight">
            Why Security Teams Choose XEROVA
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Stop losing valuable incident response hours to fragmented tool-switching. XEROVA
            consolidates the entire threat lifecycle into a single high-performance cockpit.
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="rounded-3xl border border-[#17313A] bg-[#091820]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#17313A] bg-[#050B10] text-xs font-mono uppercase tracking-wider">
                  <th className="py-4 px-6 text-[#94A3B8] w-1/3">Capability</th>
                  <th className="py-4 px-6 text-rose-400 w-1/3">
                    Fragmented Legacy Triage
                  </th>
                  <th className="py-4 px-6 text-[#00D9E8] bg-[#00D9E8]/5 w-1/3 border-l border-[#17313A]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00D9E8]" />
                      <span>XEROVA v2.0 Platform</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17313A] text-xs sm:text-sm">
                {COMPARISON_ITEMS.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#050B10]/40 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-[#F1F5F9]">
                      {item.feature}
                    </td>
                    <td className="py-4 px-6 text-[#94A3B8]">
                      <div className="flex items-start gap-2">
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item.traditional}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#F1F5F9] bg-[#00D9E8]/5 font-medium border-l border-[#17313A]">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#00D9E8] shrink-0 mt-0.5" />
                        <span>{item.xerova}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComparisonSection;
