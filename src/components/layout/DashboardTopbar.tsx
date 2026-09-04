"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import Link from "next/link";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/threats": "Threat Intelligence",
  "/assistant": "AI Copilot",
  "/reports": "Incident Reports",
  "/settings": "Preferences",
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const pageTitle = breadcrumbMap[pathname] || "Console";

  return (
    <header className="w-full flex items-center justify-between gap-4 py-2 px-1 mb-2 shrink-0">
      {/* Left: Brand / Section Name */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-primary fill-primary/30" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              XEROVA
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/25">
                INTEL
              </span>
            </span>
          </div>
        </Link>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <span>/</span>
          <span className="text-foreground font-sans font-medium">{pageTitle}</span>
        </div>
      </div>

      {/* Center: Reference Status Pill Badge */}
      <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs shadow-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          100%
        </span>
        <span className="text-muted-foreground">threat telemetry feeds operational today</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Search Shortcut */}
        <Link
          href="/threats"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card hover:bg-accent border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick Lookup...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            ⌘K
          </kbd>
        </Link>

        {/* Notifications Pill */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 rounded-full bg-card hover:bg-accent border border-border text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          aria-label="Threat alerts"
        >
          <Bell className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-mono text-primary font-bold">+4</span>
        </Button>

        {/* Polished Micro-Animated Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}

export default DashboardTopbar;
