"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  Terminal,
  Activity,
  Bot,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreatSample {
  id: string;
  type: "IP" | "URL" | "CVE" | "HASH";
  query: string;
  label: string;
  score: number;
  verdict: "CRITICAL" | "HIGH" | "MALICIOUS" | "EXPLOITABLE";
  severityColor: string;
  enginesSummary: string;
  engineBadges: { name: string; status: string; alert?: boolean }[];
  details: { label: string; value: string }[];
  mitreTags: string[];
  copilotInsight: string;
}

const PRESET_THREATS: ThreatSample[] = [
  {
    id: "ip-tor",
    type: "IP",
    query: "185.220.101.5",
    label: "Tor Exit / Proxy Node",
    score: 96,
    verdict: "CRITICAL",
    severityColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    enginesSummary: "18/22 Engines Flagged Malicious",
    engineBadges: [
      { name: "VirusTotal", status: "14/72 Malicious", alert: true },
      { name: "AbuseIPDB", status: "100% Confidence", alert: true },
      { name: "Pulsedive", status: "Threat: High", alert: true },
      { name: "AlienVault", status: "9 Active Pulses", alert: true },
    ],
    details: [
      { label: "ASN / ISP", value: "AS208323 (Tor Project Relays)" },
      { label: "Geolocation", value: "Frankfurt, Germany (DE)" },
      { label: "Open Ports", value: "9001 (ORPort), 80, 443" },
      { label: "Usage Type", value: "Anonymizer / Data Center" },
    ],
    mitreTags: ["T1090 (Proxy)", "T1110 (Brute Force)", "T1566 (Phishing Relay)"],
    copilotInsight:
      "High-confidence anonymizing exit relay actively correlated with automated credential stuffing attacks and botnet command routing. Immediate perimeter ingress block recommended.",
  },
  {
    id: "url-phish",
    type: "URL",
    query: "https://paypa1-security-verification.com/login",
    label: "Homoglyph Impersonation",
    score: 98,
    verdict: "MALICIOUS",
    severityColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    enginesSummary: "20/22 Engines Flagged Phishing",
    engineBadges: [
      { name: "URLScan", status: "Brand Spoof: PayPal", alert: true },
      { name: "Google SafeBrowsing", status: "Social Engineering", alert: true },
      { name: "VirusTotal", status: "19 Engines Malicious", alert: true },
      { name: "Punycode Engine", status: "Character Obfuscation", alert: true },
    ],
    details: [
      { label: "Target Brand", value: "PayPal Inc. (Impersonated)" },
      { label: "Domain Age", value: "2 days old (Newly Registered)" },
      { label: "Redirect Chain", value: "3 Hops (Unshortened via Bitly)" },
      { label: "Levenshtein Distance", value: "1 edit away ('1' substituted for 'l')" },
    ],
    mitreTags: ["T1566.002 (Spearphishing Link)", "T1556 (Credential Harvesting)"],
    copilotInsight:
      "Credential harvester masquerading as account verification portal. Deploys dynamic keystroke logger and OTP interception iframe. Domain sinkholing advised.",
  },
  {
    id: "cve-zero",
    type: "CVE",
    query: "CVE-2024-38077",
    label: "MadLicense Windows RDC RCE",
    score: 98,
    verdict: "CRITICAL",
    severityColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    enginesSummary: "CVSS v3.1 9.8 (Critical Severity)",
    engineBadges: [
      { name: "NIST NVD", status: "CVSS 9.8 Critical", alert: true },
      { name: "CISA KEV", status: "Known Exploited Vector", alert: true },
      { name: "Exploit DB", status: "Public PoC Available", alert: true },
      { name: "Attack Vector", status: "Network / No Auth", alert: true },
    ],
    details: [
      { label: "Component", value: "Windows Remote Desktop Licensing" },
      { label: "Vulnerability Type", value: "Remote Code Execution (RCE)" },
      { label: "Privileges Required", value: "None (Pre-Authentication)" },
      { label: "Patch Availability", value: "Microsoft July 2024 Security Update" },
    ],
    mitreTags: ["T1190 (Exploit Public-Facing App)", "T1210 (Lateral Movement via SMB/RPC)"],
    copilotInsight:
      "Zero-click wormable vulnerability in Windows Remote Desktop Licensing service. Unauthenticated remote code execution via malformed packets. Disable service or patch immediately.",
  },
  {
    id: "hash-malware",
    type: "HASH",
    query: "3a52c00a46973e46c7adfc515869d8be923831ec22728448ec629db7eead8fb0",
    label: "LockBit 3.0 Ransomware Binary",
    score: 100,
    verdict: "MALICIOUS",
    severityColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    enginesSummary: "68/72 Engines Flagged Malicious",
    engineBadges: [
      { name: "VirusTotal", status: "68/72 Detection", alert: true },
      { name: "YARA Rules", status: "LockBit3_Cryptor_v2", alert: true },
      { name: "Threat Family", status: "Ransomware.LockBit", alert: true },
      { name: "Behavior Sandboxes", status: "Shadow Copy Deletion", alert: true },
    ],
    details: [
      { label: "File Type", value: "Win32 EXE / PE32+ (x64)" },
      { label: "Subsystem", value: "Windows GUI (Anti-Analysis Hooks)" },
      { label: "C2 Communication", value: "Active over TOR SOCKS5" },
      { label: "Entropy", value: "7.94 / 8.0 (Encrypted Overlay)" },
    ],
    mitreTags: ["T1486 (Data Encrypted for Impact)", "T1490 (Inhibit System Recovery)", "T1027 (Obfuscated Files)"],
    copilotInsight:
      "High-impact ransomware payload configured to purge Volume Shadow Copies (vssadmin delete shadows) and terminate hypervisor database services before encrypting files with ChaCha20.",
  },
];

export function InteractiveIOCPreview() {
  const [selectedId, setSelectedId] = useState<string>("ip-tor");

  const activeThreat =
    PRESET_THREATS.find((t) => t.id === selectedId) || PRESET_THREATS[0];

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-[#17313A] bg-[#091820]/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Console Top Window Header */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-[#17313A] bg-[#050B10]/80 flex flex-wrap items-center justify-between gap-3">
        {/* Window controls & label */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <div className="h-4 w-px bg-[#17313A] hidden sm:block" />
          <span className="text-xs font-mono font-medium text-[#94A3B8] flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#00D9E8]" />
            <span>XEROVA_THREAT_CORRELATOR // LIVE RECON</span>
          </span>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#00D9E8]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9E8] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D9E8]"></span>
          </span>
          <span>MULTI-ENGINE STREAM: 22/22 READY</span>
        </div>
      </div>

      {/* Target Selector Tabs */}
      <div className="p-3 sm:p-4 border-b border-[#17313A] bg-[#050B10]/40">
        <div className="text-xs font-medium text-[#94A3B8] mb-2 flex items-center justify-between">
          <span>SELECT TEST INVESTIGATION TARGET:</span>
          <span className="text-[11px] font-mono text-[#00D9E8] hidden md:inline">
            CLICK TO RE-CORRELATE TELEMETRY
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESET_THREATS.map((threat) => {
            const isSelected = threat.id === selectedId;
            return (
              <button
                key={threat.id}
                type="button"
                onClick={() => setSelectedId(threat.id)}
                className={cn(
                  "p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col gap-1 cursor-pointer",
                  isSelected
                    ? "border-[#00D9E8] bg-[#00D9E8]/10 shadow-sm"
                    : "border-[#17313A] bg-[#091820] hover:bg-[#050B10] hover:border-[#17313A]/80"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded",
                      isSelected
                        ? "bg-[#00D9E8] text-[#050B10]"
                        : "bg-[#050B10] text-[#94A3B8] border border-[#17313A]"
                    )}
                  >
                    {threat.type}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-400">
                    {threat.score}/100
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#F1F5F9] truncate">
                  {threat.label}
                </div>
                <div className="text-[11px] font-mono text-[#94A3B8] truncate">
                  {threat.query}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetry Output Display */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Main Target Header + Score Gauge */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#050B10]/60 border border-[#17313A]">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-[#091820] text-[#F1F5F9] border border-[#17313A]">
                TARGET {activeThreat.type}
              </span>
              <span
                className={cn(
                  "text-xs font-mono font-bold px-2 py-0.5 rounded-full border",
                  activeThreat.severityColor
                )}
              >
                {activeThreat.verdict} THREAT
              </span>
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-[#F1F5F9] break-all">
              {activeThreat.query}
            </div>
            <p className="text-xs text-[#94A3B8]">
              {activeThreat.enginesSummary} • Correlated across 22 threat providers in 84ms
            </p>
          </div>

          {/* Unified Threat Score Meter */}
          <div className="flex items-center gap-4 bg-[#091820] px-4 py-3 rounded-xl border border-[#17313A] shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                Threat Score
              </span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-2xl font-black text-rose-400">
                  {activeThreat.score}
                </span>
                <span className="text-xs text-[#94A3B8]">/100</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 flex items-center justify-center font-mono font-bold text-xs text-rose-400">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Engine Verdict Cards */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] mb-2.5 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#00D9E8]" />
            <span>Simultaneous Engine Telemetry</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {activeThreat.engineBadges.map((badge, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#050B10]/70 border border-[#17313A] flex flex-col gap-1 shadow-xs"
              >
                <div className="text-xs font-semibold text-[#F1F5F9] flex items-center justify-between">
                  <span>{badge.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                </div>
                <div className="text-[11px] font-mono text-rose-400">
                  {badge.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Target Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {activeThreat.details.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#050B10]/50 border border-[#17313A] flex flex-col gap-0.5"
            >
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">
                {item.label}
              </span>
              <span className="text-xs font-medium text-[#F1F5F9] truncate" title={item.value}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* MITRE ATT&CK Mapping & AI Copilot Verdict */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* MITRE Tags */}
          <div className="p-4 rounded-xl bg-[#050B10]/60 border border-[#17313A] flex flex-col justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#F1F5F9] flex items-center gap-2 mb-2">
                <Lock className="w-3.5 h-3.5 text-[#00D9E8]" />
                <span>MITRE ATT&CK Matrix</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeThreat.mitreTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#091820] text-[#94A3B8] border border-[#17313A]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#00D9E8]">
              Normalized via Threat Taxonomy v2
            </span>
          </div>

          {/* AI Copilot Reasoning Box */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-gradient-to-br from-[#091820] to-[#050B10] border border-[#00D9E8]/25 flex flex-col justify-between gap-3 shadow-md shadow-black/40">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F1F5F9]">
                  <Bot className="w-4 h-4 text-[#00D9E8]" />
                  <span>Dual AI Copilot Analysis</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00D9E8]/10 text-[#00D9E8] border border-[#00D9E8]/25">
                    Gemini 1.5 + Groq LLaMA 3
                  </span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-[#00D9E8] animate-pulse" />
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed font-sans">
                {activeThreat.copilotInsight}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#17313A] text-[11px] font-mono text-[#94A3B8]">
              <span>Containment Playbook: Generated</span>
              <span className="text-[#00D9E8]">Confidence: 99.4%</span>
            </div>
          </div>
        </div>

        {/* Live Lookup CTA Strip */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-[#050B10]/70 border border-[#17313A]">
          <div className="flex items-center gap-2.5 text-xs text-[#94A3B8]">
            <Search className="w-4 h-4 text-[#00D9E8] shrink-0" />
            <span>Want to investigate your own IP, Domain, Hash, or CVE?</span>
          </div>
          <Link
            href="/threats"
            className="w-full sm:w-auto h-9 px-4 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Launch Live Lookup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InteractiveIOCPreview;
