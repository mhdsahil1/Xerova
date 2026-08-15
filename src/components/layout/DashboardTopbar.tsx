"use client";

import { usePathname } from "next/navigation";
import { Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/threats": "Threat Intelligence",
  "/assistant": "AI Assistant",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function DashboardTopbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const pageTitle = breadcrumbMap[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">XEROVA</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium">{pageTitle}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyber-cyan rounded-full" aria-hidden="true" />
          <span className="sr-only">New notifications available</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
