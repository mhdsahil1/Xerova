"use client";

import React, { useState } from "react";
import {
  Upload,
  Cpu,
  FileCheck2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: "01",
    title: "Ingest & Extract",
    icon: Upload,
    tagline: "Drop raw unstructured logs, phishing emails, or QR codes",
    description:
      "No manual parsing needed. Feed raw firewall dumps, email headers, syslog lines, or screenshot uploads. XEROVA's regex and AI parser extracts every IOC in under 50ms.",
    terminalOutput: [
      "$ xerova ingest --source syslog_alert.txt",
      "[INFO] Ingesting 2.4 MB raw syslog stream...",
      "[EXTRACT] Identified 14 unique IOCs:",
      "  -> IP: 185.220.101.5 (Remote Ingress)",
      "  -> URL: https://paypa1-security-verification.com/login",
      "  -> SHA-256: 7c5e21958b49e1e82845c228a4746698",
      "[STATUS] Extraction completed in 32ms.",
    ],
  },
  {
    step: "02",
    title: "Correlate & Score",
    icon: Cpu,
    tagline: "Simultaneous query across 22+ threat intelligence feeds",
    description:
      "All extracted indicators are dispatched concurrently across VirusTotal, AlienVault, NVD, URLScan, and AbuseIPDB. A standardized 0–100 severity index is calculated.",
    terminalOutput: [
      "$ xerova correlate --ioc-batch active_investigation",
      "[QUERY] Broadcasting to 22 Telemetry Engines...",
      "[VIRUSTOTAL] 61/72 AV Engines flagged as Malicious",
      "[ALIENVAULT] 14 Active Threat Pulses detected",
      "[NVD] Associated CVE-2024-38077 (CVSS 9.8 Critical)",
      "[MITRE ATT&CK] Mapped to T1090 (Proxy), T1566 (Phishing)",
      "[UNIFIED SCORE] 96/100 (CRITICAL THREAT POSTURE)",
    ],
  },
  {
    step: "03",
    title: "Remediate & Export",
    icon: FileCheck2,
    tagline: "Instant AI playbooks and boardroom-ready PDF dossiers",
    description:
      "The Dual AI Copilot (Gemini & Groq) reviews findings and generates precise IP firewall blocks, sinkhole DNS commands, and exports an executive PDF dossier.",
    terminalOutput: [
      "$ xerova export --format pdf --report-id INC-8924",
      "[AI COPILOT] Generated incident containment strategy:",
      "  1. iptables -A INPUT -s 185.220.101.5 -j DROP",
      "  2. DNS Sinkhole configured for *.paypa1-security-verification.com",
      "  3. Applied Microsoft Patch KB5040437 for CVE-2024-38077",
      "[SUCCESS] Boardroom PDF dossier compiled successfully.",
      "Dossier ready: file:///reports/INC-8924-executive.pdf",
    ],
  },
];

export function WorkflowTabs() {
  const [activeStep, setActiveStep] = useState(0);
  const current = STEPS[activeStep];

  return (
    <section className="py-20 md:py-28 bg-[#091820]/30 border-y border-[#17313A] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A] mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>THE 3-STEP INCIDENT LIFECYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight">
            From Raw Alert to Complete Remediation
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            See how XEROVA automates the entire incident investigation pipeline, cutting triage
            times from over an hour to less than 60 seconds.
          </p>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {STEPS.map((item, idx) => {
            const isSelected = activeStep === idx;
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={cn(
                  "p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4",
                  isSelected
                    ? "border-[#00D9E8] bg-[#091820] shadow-lg ring-1 ring-[#00D9E8]/30 shadow-[#00D9E8]/5"
                    : "border-[#17313A] bg-[#091820]/50 hover:bg-[#091820] hover:border-[#17313A]/80"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl font-black font-mono text-[#00D9E8]">
                    {item.step}
                  </span>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      isSelected ? "bg-[#00D9E8] text-[#050B10]" : "bg-[#050B10] border border-[#17313A] text-[#94A3B8]"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#F1F5F9]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                    {item.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Detail Pane & Terminal */}
        <div className="rounded-3xl border border-[#17313A] bg-[#091820]/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#050B10] text-[#00D9E8] border border-[#17313A]">
              STEP {current.step} WORKFLOW
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#F1F5F9] tracking-tight">
              {current.title}
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              {current.description}
            </p>
            <div className="pt-2 space-y-2 text-xs font-mono text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D9E8]" />
                <span>Zero manual copy-pasting across separate tabs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D9E8]" />
                <span>Autonomous parsing with instant data deduplication</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D9E8]" />
                <span>Immutable investigation timestamping</span>
              </div>
            </div>
          </div>

          {/* Right Live Terminal Simulation */}
          <div className="lg:col-span-7 rounded-2xl border border-[#17313A] bg-[#050B10] p-5 font-mono text-xs text-[#94A3B8] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#17313A]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-[#94A3B8] ml-2">
                  bash - xerova-cli v2.0
                </span>
              </div>
              <span className="text-[10px] text-[#00D9E8] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9E8] animate-ping"></span>
                CONNECTED
              </span>
            </div>

            <div className="space-y-1.5 min-h-[180px]">
              {current.terminalOutput.map((line, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "leading-relaxed",
                    line.startsWith("$")
                      ? "text-[#00D9E8] font-bold"
                      : line.includes("[CRITICAL") || line.includes("Malicious")
                      ? "text-rose-400"
                      : line.includes("[SUCCESS]")
                      ? "text-emerald-400 font-semibold"
                      : line.startsWith("  ->")
                      ? "text-[#F1F5F9]"
                      : "text-[#94A3B8]"
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkflowTabs;
