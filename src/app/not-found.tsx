// ==============================================================================
// XEROVA — Custom 404 Not Found Security Console Experience
//
// Integrated with No-as-a-Service rejection oracle by @hotheadhacker (MIT)
// ==============================================================================

import Link from "next/link";
import Image from "next/image";
import {
  ShieldAlert,
  Terminal,
  LayoutDashboard,
  Home,
  ExternalLink,
  Radio,
  Zap,
} from "lucide-react";
import { getRejectionReason } from "@/lib/rejection-oracle";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const rejectionReason = await getRejectionReason();

  return (
    <div className="min-h-screen w-full bg-canvas-bg text-foreground p-3 sm:p-5 md:p-8 flex items-center justify-center antialiased">
      {/* Outer Floating Application Shell Container */}
      <main className="w-full max-w-3xl rounded-[24px] sm:rounded-[30px] border border-border bg-card/95 p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Subtle Cybersecurity Watermark Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none rounded-[30px]"
          style={{
            backgroundImage: "radial-gradient(var(--foreground) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden="true"
        />

        {/* Top Header Row: Brand Identity & Telemetry Status */}
        <div className="flex items-center justify-between gap-3 pb-5 sm:pb-6 border-b border-border/80 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Zap className="w-4 h-4 text-primary fill-primary/30" />
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-sm tracking-wider uppercase text-foreground flex items-center gap-1.5">
                XEROVA
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/25">
                  INTEL
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Security Console Dispatcher
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span>HTTP 404</span>
          </div>
        </div>

        {/* Inner Console Terminal Display Area */}
        <div className="py-8 sm:py-10 text-center space-y-6 relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>oracle.routing.dispatcher // ROUTE_EXCEPTION</span>
          </div>

          {/* Large Monospace 404 Headline */}
          <div className="space-y-2">
            <h1 className="text-6xl sm:text-8xl font-mono font-extrabold tracking-tight text-foreground select-none">
              404
            </h1>
            <div className="text-base sm:text-lg font-mono font-semibold tracking-wide uppercase text-primary">
              RESOURCE NOT FOUND
            </div>
            <div className="text-xs sm:text-sm font-mono tracking-widest text-muted-foreground uppercase">
              XEROVA SAYS NO
            </div>
          </div>

          {/* Console Divider */}
          <div className="w-24 h-px bg-border mx-auto" />

          {/* Explanatory Cybersecurity Status Copy */}
          <div className="space-y-1 font-mono text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            <p>XEROVA searched the requested route.</p>
            <p className="text-foreground font-semibold">
              Result: <span className="text-destructive font-mono">negative</span>.
            </p>
          </div>

          {/* Dynamic / Random Rejection Quote Box */}
          <div className="max-w-xl mx-auto p-5 sm:p-6 rounded-2xl border border-border bg-muted/30 dark:bg-black/40 text-left space-y-2.5 relative shadow-inner">
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground border-b border-border/60 pb-2">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Radio className="w-3 h-3 text-primary animate-pulse" />
                rejection.telemetry.payload
              </span>
              <span className="text-primary font-semibold">STATUS: BLOCKED</span>
            </div>

            <blockquote className="text-sm sm:text-base font-sans font-medium text-foreground leading-relaxed pt-1">
              &ldquo;{rejectionReason}&rdquo;
            </blockquote>
          </div>

          {/* Navigation Recovery Actions */}
          <nav
            aria-label="Recovery navigation"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3"
          >
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-all active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Home className="w-4 h-4 text-muted-foreground" />
              <span>Go Home</span>
            </Link>
          </nav>
        </div>

        {/* Footer Meta & MIT Attribution */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono relative z-10">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-primary" />
            <span>XEROVA DEFENSE SYSTEM</span>
            <span>•</span>
            <span>VERDICT: REFUSAL</span>
          </div>

          <a
            href="https://github.com/hotheadhacker/no-as-a-service"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] hover:text-foreground inline-flex items-center gap-1 transition-colors group"
          >
            <span>Rejection telemetry powered by No-as-a-Service</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </main>
    </div>
  );
}
