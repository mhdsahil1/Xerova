"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Radio, Terminal, Lock } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-[#17313A] bg-[#050B10] backdrop-blur-md pt-16 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-[#091820] border border-[#17313A] flex items-center justify-center p-1.5 shadow-xs">
                <Image
                  src="/xerova-icon.svg"
                  alt="XEROVA"
                  width={26}
                  height={26}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-[#F1F5F9]">
                  XEROVA
                </span>
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                  Threat Intel Console
                </span>
              </div>
            </Link>

            <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm">
              Autonomous threat intelligence and security operations platform. Normalizing 22+
              telemetry providers into actionable intelligence for SOC analysts and incident responders.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#091820] border border-[#17313A] text-xs font-mono text-[#00D9E8]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9E8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00D9E8]"></span>
              </span>
              <span>All 22 Telemetry Engines Operational</span>
            </div>
          </div>

          {/* Col 1: Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9] mb-3 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00D9E8]" /> Platform
            </h4>
            <ul className="space-y-2 text-xs text-[#94A3B8]">
              <li>
                <Link href="/dashboard" className="hover:text-[#00D9E8] transition-colors">
                  SOC Overview
                </Link>
              </li>
              <li>
                <Link href="/threats" className="hover:text-[#00D9E8] transition-colors">
                  Threat Intelligence
                </Link>
              </li>
              <li>
                <Link href="/threats" className="hover:text-[#00D9E8] transition-colors">
                  Anti-Quishing Scanner
                </Link>
              </li>
              <li>
                <Link href="/vulnerabilities" className="hover:text-[#00D9E8] transition-colors">
                  CVE Vulnerabilities
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-[#00D9E8] transition-colors">
                  AI Security Copilot
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-[#00D9E8] transition-colors">
                  Incident Dossiers
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Telemetry Engines */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9] mb-3 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#00D9E8]" /> Telemetry
            </h4>
            <ul className="space-y-2 text-xs text-[#94A3B8]">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9E8]/60"></span>
                VirusTotal (70+ AV)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9E8]/60"></span>
                AlienVault OTX
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9E8]/60"></span>
                NIST NVD Live Sync
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9E8]/60"></span>
                URLScan.io Sandbox
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9E8]/60"></span>
                Pulsedive Scoring
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D9E8]/60"></span>
                AbuseIPDB Database
              </li>
            </ul>
          </div>

          {/* Col 3: Security & Access */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9] mb-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#00D9E8]" /> Access &amp; Docs
            </h4>
            <ul className="space-y-2 text-xs text-[#94A3B8]">
              <li>
                <Link href="/login" className="hover:text-[#00D9E8] transition-colors">
                  Sign In to Console
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#00D9E8] transition-colors">
                  Create Analyst Account
                </Link>
              </li>
              <li>
                <Link href="/browser-guard" className="hover:text-[#00D9E8] transition-colors">
                  Browser Guard Extension
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#00D9E8] transition-colors">
                  Security Policies
                </Link>
              </li>
              <li>
                <span className="text-[11px] font-mono text-[#00D9E8]">
                  AES-256-GCM / TLS 1.3
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Legal Strip */}
        <div className="pt-8 border-t border-[#17313A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <p>© {new Date().getFullYear()} XEROVA. All rights reserved. Next-Gen Threat Intelligence.</p>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>SOC-2 TYPE II</span>
            <span>MITRE ATT&CK ALIGNED</span>
            <span>ZERO-DATA RETENTION</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
