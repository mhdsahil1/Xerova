"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AuroraHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The main title text to display with the glass displacement effect. */
  title?: string;
  /** Subtitle or supplementary text */
  subtitle?: string;
  /** Custom children elements */
  children?: React.ReactNode;
}

export function AuroraHero({
  title = "Vengeance UI",
  subtitle,
  children,
  className,
  ...props
}: AuroraHeroProps) {
  // Safely URL-encoded SVG string for the fluted glass effect
  const filterImageHref =
    "data:image/svg+xml," +
    encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1' color-interpolation-filters='sRGB'>
      <g>
        <rect width='1' height='1' fill='black' />
        <rect width='1' height='1' fill='url(#cyan)' style='mix-blend-mode:screen' />
        <rect width='1' height='1' fill='url(#blue)' style='mix-blend-mode:screen' />
        <rect width='1' height='1' fill='url(#purple)' style='mix-blend-mode:screen' />
      </g>
      <defs>
        <radialGradient id='purple' cx='0' cy='0' r='1' >
          <stop stop-color='#a855f7' />
          <stop stop-color='#a855f7' offset='1' stop-opacity='0' />
        </radialGradient>
        <radialGradient id='blue' cx='1' cy='0' r='1' >
          <stop stop-color='#3b82f6' />
          <stop stop-color='#3b82f6' offset='1' stop-opacity='0' />
        </radialGradient>
        <radialGradient id='cyan' cx='0' cy='1' r='1' >
          <stop stop-color='#06b6d4' />
          <stop stop-color='#06b6d4' offset='1' stop-opacity='0' />
        </radialGradient>
      </defs>
    </svg>
  `);

  return (
    <section
      className={cn(
        "aurora-hero-wrapper w-full min-h-[400px] h-[500px] sm:h-[600px] relative overflow-hidden flex flex-col items-center justify-center rounded-2xl border border-white/10 shadow-2xl",
        className
      )}
      {...props}
    >
      <style>{`
        .aurora-hero-wrapper {
          --stripe-color: #000;
          --bg-filter: blur(14px) opacity(60%) saturate(190%);
          background: var(--stripe-color);
        }
        :is(.dark) .aurora-hero-wrapper {
          --stripe-color: #fff;
          --bg-filter: blur(14px) invert(100%);
        }
        @keyframes smoothBg {
          from { background-position: 50% 50%, 50% 50%; }
          to { background-position: 350% 50%, 350% 50%; }
        }
        .aurora-hero-bg {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          --stripes: repeating-linear-gradient(
            100deg, 
            var(--stripe-color) 0%, 
            var(--stripe-color) 7%, 
            transparent 10%, 
            transparent 12%, 
            var(--stripe-color) 16%
          );
          --rainbow: repeating-linear-gradient(
            100deg, 
            #06b6d4 10%, 
            #3b82f6 15%, 
            #a855f7 20%, 
            #06b6d4 25%, 
            #38bdf8 30%
          );
          background-image: var(--stripes), var(--rainbow);
          background-size: 300%, 200%;
          background-position: 50% 50%, 50% 50%;
          filter: var(--bg-filter);
          mask-image: radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%);
        }
        .aurora-hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: var(--stripes), var(--rainbow);
          background-size: 200%, 100%;
          animation: smoothBg 60s linear infinite;
          background-attachment: fixed;
          mix-blend-mode: difference;
        }
        .aurora-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1.5rem;
          backdrop-filter: contrast(0.9) blur(4px);
          -webkit-backdrop-filter: contrast(0.9) blur(4px);
        }
        .h1-scalingSize {
          font-size: clamp(2.5rem, 6vw, 5.5rem);
          position: relative;
          isolation: isolate;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: white;
          text-shadow: 0 0 40px rgba(6, 182, 212, 0.4);
        }
      `}</style>

      <div className="aurora-hero-bg" aria-hidden="true" />

      <div className="aurora-content">
        <h1 className="h1-scalingSize" data-text={title}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-sm sm:text-base text-slate-300 font-mono max-w-lg">
            {subtitle}
          </p>
        )}
        {children}
      </div>

      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        colorInterpolationFilters="sRGB"
        style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
        aria-hidden="true"
        focusable="false"
      >
        <filter id="fluted" primitiveUnits="objectBoundingBox">
          <feImage
            x="0"
            y="0"
            result="image_0"
            crossOrigin="anonymous"
            href={filterImageHref}
            preserveAspectRatio="none meet"
            width=".03"
            height="1"
          />
          <feTile in="image_0" result="tile_0" />
          <feGaussianBlur stdDeviation=".0001" edgeMode="none" in="tile_0" result="bar_smoothness" x="0" y="0" />
          <feDisplacementMap scale=".08" xChannelSelector="R" yChannelSelector="G" in="SourceGraphic" in2="bar_smoothness" result="displacement_0" />
        </filter>
      </svg>
    </section>
  );
}

/**
 * Ambient, GPU-accelerated cyber aurora background component for the application layout.
 * Emits glowing fluid streams with vignette contrast so glassmorphic cards float with depth.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden select-none",
        className
      )}
      aria-hidden="true"
    >
      <style>{`
        @keyframes auroraFloat {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate(4%, -3%) rotate(4deg) scale(1.08);
          }
          66% {
            transform: translate(-3%, 4%) rotate(-3deg) scale(0.95);
          }
          100% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
        }
        @keyframes auroraWave {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .aurora-mesh {
          position: absolute;
          inset: -40%;
          width: 180%;
          height: 180%;
          background: radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.18) 0%, transparent 45%),
                      radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.16) 0%, transparent 45%),
                      radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.14) 0%, transparent 50%),
                      radial-gradient(circle at 75% 75%, rgba(20, 184, 166, 0.12) 0%, transparent 40%);
          filter: blur(60px);
          animation: auroraFloat 28s ease-in-out infinite;
          opacity: 0.85;
        }
        .aurora-stripes-layer {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            115deg,
            rgba(6, 182, 212, 0.04) 0%,
            rgba(6, 182, 212, 0.04) 4%,
            transparent 6%,
            transparent 10%,
            rgba(99, 102, 241, 0.04) 14%
          );
          background-size: 250% 250%;
          animation: auroraWave 35s ease infinite;
          mix-blend-mode: screen;
        }
      `}</style>

      {/* Primary Ambient Aurora Mesh */}
      <div className="aurora-mesh" />

      {/* Cyber Wave Refraction Layer */}
      <div className="aurora-stripes-layer" />

      {/* Radial Vignette & Grid Texture Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,10,15,0.65)_70%,rgba(5,6,10,0.92)_100%)]" />
      <div className="absolute inset-0 bg-grid opacity-20" />
    </div>
  );
}

export default AuroraHero;
