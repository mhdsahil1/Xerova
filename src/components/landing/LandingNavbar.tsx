"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

interface LandingNavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Live Telemetry", href: "#telemetry" },
  { label: "Interactive Demo", href: "#interactive-demo" },
  { label: "AI Copilot", href: "#copilot" },
  { label: "Security & Trust", href: "#security" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNavbar({ user }: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-[#050B10]/85 backdrop-blur-xl border-b border-[#17313A] shadow-lg shadow-black/50"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Emblem */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#091820] border border-[#17313A] group-hover:border-[#00D9E8]/40 transition-colors shadow-sm overflow-hidden p-1.5">
            <Image
              src="/xerova-icon.svg"
              alt="XEROVA"
              width={28}
              height={28}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-[#F1F5F9] group-hover:text-[#00D9E8] transition-colors">
                XEROVA
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#00D9E8]/10 text-[#00D9E8] border border-[#00D9E8]/20">
                v2.0
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#94A3B8] hidden sm:block tracking-wider uppercase">
              Autonomous Threat Intel
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#091820] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Indicator (Desktop only) */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#091820] border border-[#17313A] text-[11px] font-mono text-[#94A3B8]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D9E8] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D9E8]"></span>
            </span>
            <span className="text-[10px] tracking-wider text-[#94A3B8]">22 ENGINES SYNCED</span>
          </div>

          <ThemeToggle size="sm" />

          {user ? (
            <Link
              href="/dashboard"
              className="h-9 px-4 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-semibold text-xs shadow-md shadow-[#00D9E8]/15 flex items-center gap-1.5 transition-all"
            >
              <span>Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex h-9 px-3.5 items-center text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#091820] rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="h-9 px-4 rounded-xl bg-[#00D9E8] text-[#050B10] hover:bg-[#00D9E8]/90 font-semibold text-xs shadow-md shadow-[#00D9E8]/15 flex items-center gap-1.5 transition-all"
              >
                <span>Get Started</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#091820] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#F1F5F9]" />
            ) : (
              <Menu className="w-5 h-5 text-[#F1F5F9]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#17313A] bg-[#091820] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-[#F1F5F9] hover:bg-[#050B10] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-[#17313A] flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-10 px-4 rounded-xl bg-[#00D9E8] text-[#050B10] font-semibold text-sm flex items-center justify-center gap-2"
              >
                Go to Security Console
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-10 px-4 rounded-xl border border-[#17313A] bg-[#050B10] text-[#F1F5F9] font-medium text-sm flex items-center justify-center"
                >
                  Sign In to Console
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-10 px-4 rounded-xl bg-[#00D9E8] text-[#050B10] font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  <span>Get Started Free</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
