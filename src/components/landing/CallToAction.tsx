"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";

interface CallToActionProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function CallToAction({ user }: CallToActionProps) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-[#17313A] bg-gradient-to-b from-[#091820] via-[#091820] to-[#050B10] backdrop-blur-2xl p-8 sm:p-14 lg:p-16 text-center shadow-2xl overflow-hidden">
          {/* Ambient neon rim & glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#00D9E8] to-transparent pointer-events-none" />
          <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#00D9E8]/[0.08] blur-[100px] select-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-[#050B10] text-[#00D9E8] border border-[#17313A] shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE NEXT GENERATION OF THREAT INTELLIGENCE</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F1F5F9] tracking-tight leading-tight">
              Ready to Accelerate Your Threat Operations?
            </h2>

            <p className="text-sm sm:text-lg text-[#94A3B8] leading-relaxed">
              Experience the power of 22+ cyber engines and dual AI reasoning in a single high-speed
              console. Stop switching between 10 different tabs.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-bold text-sm shadow-xl shadow-[#00D9E8]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-bold text-sm shadow-xl shadow-[#00D9E8]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Launch Free Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <Link
                href="/threats"
                className="w-full sm:w-auto h-12 px-8 rounded-xl border border-[#17313A] bg-[#050B10] hover:bg-[#091820] hover:border-[#00D9E8]/40 font-medium text-sm text-[#F1F5F9] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-[#00D9E8]" />
                <span>Explore Threat Search</span>
              </Link>
            </div>

            <div className="pt-4 text-xs font-mono text-[#94A3B8] flex items-center justify-center gap-4">
              <span>● FREE COMMUNITY ACCESS</span>
              <span>● NO SETUP TIME</span>
              <span>● LIVE IOC RECON</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;
