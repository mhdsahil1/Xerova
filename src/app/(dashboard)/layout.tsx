"use client";

import { SessionProvider } from "next-auth/react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardTopbar />
          <div className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
