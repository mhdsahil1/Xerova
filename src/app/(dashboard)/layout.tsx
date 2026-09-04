"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAssistantChat = pathname === "/assistant";

  return (
    <SessionProvider>
      {/* Outer Layer: Adaptive Application Canvas */}
      <div className="min-h-screen w-full bg-canvas-bg text-foreground p-2 sm:p-3 md:p-4 lg:p-5 flex items-center justify-center antialiased">
        {/* Floating Application Shell Container */}
        <div className="app-shell w-full max-w-[1680px] h-[calc(100vh-1rem)] md:h-[calc(100vh-2.5rem)] rounded-[22px] sm:rounded-[28px] md:rounded-[32px] p-3 sm:p-4 md:p-4.5 flex flex-col md:flex-row gap-3 md:gap-4 overflow-hidden relative">
          {/* Left: Floating Navigation Tool Dock (Anchored at Top) */}
          <AppSidebar />

          {/* Right: Main Workspace Section (Scrolls smoothly alongside the fixed sidebar) */}
          <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <DashboardTopbar />
            
            {/* Workstation Canvas: full-height flex column for chat, scrollable for dashboard/reports */}
            <div
              className={cn(
                "flex-1 min-h-0",
                isAssistantChat
                  ? "flex flex-col overflow-hidden pb-1"
                  : "overflow-y-auto overflow-x-hidden pt-1 pb-4 pr-1 sm:pr-2 space-y-5"
              )}
            >
              {children}
              {!isAssistantChat && <Footer />}
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
