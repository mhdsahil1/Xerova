"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  CheckCircle2,
  Shield,
  Zap,
} from "lucide-react";
import { InteractiveIOCPreview } from "@/components/landing/InteractiveIOCPreview";
import PistachioFloret from "@/components/originkit/ui/pistachio-floret-custom-style";
import TextRevealBlur from "@/components/originkit/ui/blob-text-reveal";

interface HeroSectionProps {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function HeroSection({ user }: HeroSectionProps) {
  return (
    <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      {/* Restrained Lighting Glows in Hero */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 w-[600px] h-[400px] rounded-full bg-[#00D9E8]/[0.05] blur-[140px] select-none"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 right-10 w-[500px] h-[450px] rounded-full bg-[#00A6A6]/[0.04] blur-[120px] select-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Asymmetric Two-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-14 items-center">
          {/* Left Column: Eyebrow, Headline, Description, CTAs, Trust */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 sm:space-y-7">
            {/* Eyebrow Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium bg-[#091820] text-[#00D9E8] border border-[#17313A] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9E8] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D9E8]"></span>
              </span>
              <span className="font-semibold tracking-wider text-[11px]">XEROVA PLATFORM v2.0</span>
              <span className="text-[#94A3B8]/60">•</span>
              <span className="text-[#94A3B8] text-[11px] hidden sm:inline">AUTONOMOUS THREAT INTEL</span>
            </div>

            {/* Bold Modern Headline with Blob Text Reveal */}
            <div className="space-y-2 w-full">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-extrabold tracking-tight text-[#F1F5F9] leading-[1.08]">
                Autonomous Threat Intelligence.
              </h1>
              <div className="w-full flex items-center min-h-[48px] sm:min-h-[58px] lg:min-h-[70px]">
                <TextRevealBlur
                  texts={["Investigate.", "Correlate.", "Defend."]}
                  font={{
                    fontFamily: "inherit",
                    fontSize: "clamp(2rem, 4vw, 3.5rem)",
                    fontWeight: 800,
                    textAlign: "left",
                    letterSpacing: "-0.025em",
                    lineHeight: "1.15em",
                  }}
                  color="#00D9E8"
                  wipeColor="#00A6A6"
                  revealColor="#00D9E8"
                  blobSize={14}
                  blobPosition={-2}
                />
              </div>
            </div>

            {/* High-Contrast Readable Description */}
            <p className="text-base sm:text-lg text-[#94A3B8] max-w-xl leading-relaxed font-normal">
              Enterprise-grade cybersecurity command center engineered for SOC teams, incident
              responders, and security researchers. Unify <span className="text-[#F1F5F9] font-medium">22+ telemetry engines</span>, decode quishing vectors, triage zero-days, and generate boardroom-ready dossiers in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              {user ? (
                <Link
                  href="/dashboard"
                  className="h-12 px-7 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-semibold text-sm shadow-lg shadow-[#00D9E8]/20 transition-all duration-200 hover:shadow-[#00D9E8]/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Enter Security Console</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="h-12 px-7 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-semibold text-sm shadow-lg shadow-[#00D9E8]/20 transition-all duration-200 hover:shadow-[#00D9E8]/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Launch Free Console</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}

              <a
                href="#interactive-demo"
                className="h-12 px-6 rounded-xl border border-[#17313A] bg-[#091820]/90 hover:bg-[#091820] hover:border-[#00D9E8]/40 text-[#F1F5F9] font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Terminal className="w-4 h-4 text-[#00D9E8]" />
                <span>Test Live Sandbox</span>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-[#94A3B8] font-mono pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00D9E8]" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#00D9E8]" />
                <span>Instant SOC Onboarding</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#00D9E8]" />
                <span>Sub-120ms Correlation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Primary Visual Attraction 3D Model */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center">
            {/* Subtle radial cyan glow centered behind the 3D model */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="w-[300px] sm:w-[400px] lg:w-[460px] h-[300px] sm:h-[400px] lg:h-[460px] rounded-full bg-[#00D9E8]/[0.10] blur-[90px]" />
              <div className="w-[180px] sm:w-[240px] lg:w-[280px] h-[180px] sm:h-[240px] lg:h-[280px] rounded-full bg-[#00A6A6]/[0.12] blur-[60px]" />
            </div>

            {/* Technical HUD Framing Ring */}
            <div
              className="pointer-events-none absolute w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] lg:w-[480px] lg:h-[480px] rounded-full border border-[#17313A]/50 opacity-40 select-none flex items-center justify-center"
              aria-hidden="true"
            >
              <div className="w-[90%] h-[90%] rounded-full border border-dashed border-[#00D9E8]/20 animate-[spin_60s_linear_infinite]" />
            </div>

            {/* 3D Model Interactive Viewport */}
            <div className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] lg:h-[520px] max-w-[500px] cursor-grab active:cursor-grabbing select-none">
              <PistachioFloret
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
                size={620}
                speed={30}
                dragSens={50}
                hover={45}
                background="transparent"
                faceColor="#00D9E8"
                faceLight="#00A6A6"
                sideColor="#091820"
                advanced={{
                  lineColor: "#00D9E8",
                  bevelColor: "#F1F5F9",
                  sideLight: "#17313A",
                  sideShadow: "#050B10",
                  crease: "#02060A",
                  bounce: "#00A6A6",
                  sway: 8,
                  tiltSway: 4,
                  bob: 8,
                  gloss: 28,
                  specular: 75,
                }}
                image={{
                  alt: "XEROVA Autonomous Threat Core",
                  src: "/xerova-icon.svg",
                }}
              />
            </div>
          </div>
        </div>

        {/* Hero Interactive IOC Preview Container */}
        <div id="interactive-demo" className="mt-16 sm:mt-24 scroll-mt-24">
          <InteractiveIOCPreview />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
