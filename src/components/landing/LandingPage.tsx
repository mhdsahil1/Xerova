"use client";

import React from "react";
import SwellGrid from "@/components/originkit/ui/swell-grid";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { EngineMarquee } from "@/components/landing/EngineMarquee";
import { ImpactMetrics } from "@/components/landing/ImpactMetrics";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { AICopilotSection } from "@/components/landing/AICopilotSection";
import { WorkflowTabs } from "@/components/landing/WorkflowTabs";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { SecurityTrustSection } from "@/components/landing/SecurityTrustSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CallToAction } from "@/components/landing/CallToAction";
import { LandingFooter } from "@/components/landing/LandingFooter";

interface LandingPageProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function LandingPage({ user }: LandingPageProps) {
  return (
    <div className="relative min-h-screen bg-[#050B10] text-[#F1F5F9] flex flex-col selection:bg-[#00D9E8]/25 selection:text-[#F1F5F9] overflow-x-hidden">
      {/* Swell Grid Atmospheric Perspective Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden opacity-60 dark:opacity-80 transition-opacity duration-500"
        aria-hidden="true"
      >
        <SwellGrid
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            minWidth: "100%",
            minHeight: "100%",
          }}
          background="#050B10"
          baseColor="rgba(0, 217, 232, 0.65)"
          size={10}
          speed={40}
        />

        {/* Technical Coordinate Grid Pattern overlay (opacity ~4%) */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00D9E8 1px, transparent 1px),
              linear-gradient(to bottom, #00D9E8 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Restrained Ambient Radial Gradients (Depth & Lighting) */}
        <div className="absolute top-0 right-1/4 w-[700px] h-[600px] rounded-full bg-[#00D9E8]/[0.05] blur-[150px]" />
        <div className="absolute top-1/3 left-1/6 w-[600px] h-[500px] rounded-full bg-[#00A6A6]/[0.04] blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[500px] rounded-full bg-[#091820]/80 blur-[140px]" />

        {/* Edge Vignette & Readability Overlays for Command Center Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,11,16,0.35)_50%,rgba(5,11,16,0.92)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B10]/40 via-transparent to-[#050B10]/80" />
      </div>

      {/* Main Page Layout */}
      <div className="relative z-10 flex flex-col flex-grow">
        {/* Navigation Bar */}
        <LandingNavbar user={user} />

        {/* Hero Section with Asymmetric 2-Column Composition & Interactive Demo */}
        <main className="flex-grow">
          <HeroSection user={user} />

          {/* Real-time Telemetry Engine Marquee */}
          <EngineMarquee />

          {/* Performance & SOC Impact Metrics */}
          <ImpactMetrics />

          {/* Core Feature Pillars */}
          <FeatureShowcase />

          {/* Dual AI Threat Copilot Spotlight */}
          <AICopilotSection />

          {/* 3-Step Interactive Investigation Workflow */}
          <WorkflowTabs />

          {/* Side-by-Side Comparison Matrix */}
          <ComparisonSection />

          {/* Enterprise Compliance, Encryption & Trust */}
          <SecurityTrustSection />

          {/* Frequently Asked Questions */}
          <FAQSection />

          {/* Bottom Conversion Call To Action */}
          <CallToAction user={user} />
        </main>

        {/* Cybersecurity Footer */}
        <LandingFooter />
      </div>
    </div>
  );
}

export default LandingPage;
