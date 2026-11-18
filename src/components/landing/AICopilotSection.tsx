"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const COPILOT_ABILITIES = [
  {
    title: "Instant IOC Extraction",
    description: "Paste a 500-line server log or messy email header. The AI parses every IP, SHA-256 hash, and domain instantly.",
  },
  {
    title: "MITRE ATT&CK Correlation",
    description: "Automatically maps indicators and adversary behavior to relevant Enterprise MITRE ATT&CK techniques.",
  },
  {
    title: "Containment Playbooks",
    description: "Generates step-by-step containment instructions, including exact iptables, Suricata, and PowerShell commands.",
  },
  {
    title: "Executive Impact Summaries",
    description: "Translates deep technical CVE telemetry into clear, non-technical executive briefs for CISOs and boardrooms.",
  },
];

export function AICopilotSection() {
  return (
    <section id="copilot" className="py-20 md:py-28 relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-[#00D9E8]/[0.04] blur-[140px] select-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text & Abilities */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DUAL AI THREAT COPILOT</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F5F9] tracking-tight leading-tight">
              An Elite Security Analyst Sitting Right Beside You
            </h2>

            <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
              Powered by Google Gemini 1.5 for deep semantic threat correlation and Groq LLaMA 3
              for sub-second containment playbook generation. Never start an investigation from
              scratch again.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {COPILOT_ABILITIES.map((ability, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#091820] border border-[#17313A] backdrop-blur-md shadow-xs space-y-1.5"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F1F5F9]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00D9E8] shrink-0" />
                    <span>{ability.title}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {ability.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/assistant"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-semibold text-xs shadow-md shadow-[#00D9E8]/20 transition-all cursor-pointer"
              >
                <span>Chat with Security Copilot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Simulated Copilot Chat Window */}
          <div className="lg:col-span-6 rounded-3xl border border-[#17313A] bg-[#091820]/90 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#17313A]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00D9E8]/10 border border-[#00D9E8]/25 flex items-center justify-center text-[#00D9E8]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#F1F5F9] flex items-center gap-1.5">
                    <span>XEROVA AI Copilot</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">
                    Active Session • IOC Extraction Model
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#050B10] text-[#94A3B8] border border-[#17313A]">
                Groq 220 tok/s
              </span>
            </div>

            {/* Chat Bubble: User */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#050B10] border border-[#17313A] flex items-center justify-center text-[10px] font-mono text-[#94A3B8] shrink-0 mt-0.5">
                SOC
              </div>
              <div className="p-3 rounded-2xl rounded-tl-sm bg-[#050B10]/80 border border-[#17313A] text-xs text-[#F1F5F9] max-w-[85%] font-mono">
                Suspicious email received claiming to be Microsoft 365 password expiry with link
                `http://login.micros0ft-support.online/auth`. What&apos;s our posture?
              </div>
            </div>

            {/* Chat Bubble: Assistant */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#00D9E8]/20 border border-[#00D9E8]/40 flex items-center justify-center text-[#00D9E8] shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-[#00D9E8]/[0.06] border border-[#00D9E8]/25 text-xs text-[#F1F5F9] space-y-2.5 max-w-[90%]">
                <div className="font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                  <span>🚨 HIGH RISK PHISHING CAMPAIGN DETECTED</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  The domain is a <strong className="text-[#F1F5F9]">typosquatting imposter</strong> (0 substituted for &apos;o&apos;). 
                  Registered 14 hours ago in Seychelles via NameSilo. 
                  Redirects to an Azure-hosted token-stealing reverse proxy.
                </p>
                <div className="p-2.5 rounded-xl bg-[#050B10] border border-[#17313A] font-mono text-[11px] text-[#00D9E8] space-y-1">
                  <div className="text-[10px] text-[#94A3B8] font-semibold">IMMEDIATE MITIGATION:</div>
                  <div>1. Block FQDN: *.micros0ft-support.online</div>
                  <div>2. Revoke active refresh tokens for user mailbox</div>
                  <div>3. Search logs for outbound POSTs to /auth in last 24h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AICopilotSection;
