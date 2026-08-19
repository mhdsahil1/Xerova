"use client";

import { SessionProvider } from "next-auth/react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Footer } from "@/components/layout/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {/* Outer Layer: Dark Graphite Page Canvas */}
      <div className="min-h-screen w-full bg-[#0d0e12] text-foreground p-2 sm:p-3 md:p-4 lg:p-5 flex items-center justify-center antialiased select-none">
        {/* Floating Application Shell Container */}
        <div className="w-full max-w-[1680px] h-[calc(100vh-1rem)] md:h-[calc(100vh-2.5rem)] rounded-[22px] sm:rounded-[28px] md:rounded-[32px] bg-[#08090c] border border-white/[0.08] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.05)] p-3 sm:p-4 md:p-4.5 flex flex-col md:flex-row gap-3 md:gap-4 overflow-hidden relative">
          {/* Left: Floating Navigation Tool Dock (Anchored at Top) */}
          <AppSidebar />

          {/* Right: Main Workspace Section (Scrolls smoothly alongside the fixed sidebar) */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <DashboardTopbar />
            
            {/* Scrollable Workstation Canvas */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1 pb-4 pr-1 sm:pr-2 space-y-5">
              {children}
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
