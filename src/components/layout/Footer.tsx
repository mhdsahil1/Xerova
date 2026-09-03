"use client";

import React from "react";
import Link from "next/link";
import { Shield, Radio, Terminal } from "lucide-react";
import { AnimatedFooter } from "@/components/ui/animated-footer";

export function Footer() {
  return (
    <footer className="mt-8 w-full rounded-2xl border border-white/[0.08] bg-[#12141a] p-5 md:p-6 shadow-xl">
      {/* Top quick links & status bar */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold tracking-wider text-xs uppercase text-white">XEROVA Intel</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Next-generation autonomous cybersecurity intelligence and threat hunting platform.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span>All Threat Engines Operational</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-primary" /> Platform
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors duration-150">
                  SOC Overview
                </Link>
              </li>
              <li>
                <Link href="/threats" className="hover:text-white transition-colors duration-150">
                  Threat Intelligence
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-white transition-colors duration-150">
                  AI Security Copilot
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-white transition-colors duration-150">
                  Incident Reports
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-primary" /> Telemetry Feeds
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                AlienVault OTX Integration
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                VirusTotal Multi-Scanner
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                URLScan Automated Sandbox
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                CISA &amp; MITRE ATT&amp;CK Sync
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              System Info
            </h4>
            <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/40 font-mono text-xs space-y-1 text-muted-foreground">
              <div>ENV: <span className="text-primary">PRODUCTION-SOC</span></div>
              <div>VERSION: <span className="text-white font-medium">v1.4.2-sec</span></div>
              <div>ENCRYPTION: <span className="text-emerald-400">AES-256-GCM</span></div>
              <div>STATUS: <span className="text-emerald-400">ACTIVE-MONITORING</span></div>
            </div>
          </div>
        </div>

        {/* Cinematic ASCII Interactive Animated Footer with Morphing Text */}
        <div
          className="relative h-[320px] md:h-[380px] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black/50 opacity-90"
          aria-hidden="true"
        >
          <AnimatedFooter
            morphWords={["XEROVA", "CYBER INTEL", "THREAT HUNT", "DEFENSE AI"]}
            morphSubtext="Next-Gen Cybersecurity Intelligence Platform"
            morphInterval={2600}
            leftImage="/animated-footer/hand-left.jpg"
            rightImage="/animated-footer/hand-right.jpg"
            hoverColor="#06b6d4"
            charColor="#0891b2"
            revealOnScroll={true}
          />
        </div>

        {/* Copyright Bar */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} XEROVA Cybersecurity Platform. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/settings" className="hover:text-white transition-colors duration-150">
              Security Policies
            </Link>
            <Link href="/settings" className="hover:text-white transition-colors duration-150">
              System Preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
