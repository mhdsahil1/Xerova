"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Threat Intelligence",
    href: "/threats",
    icon: Search,
  },
  {
    title: "AI Assistant",
    href: "/assistant",
    icon: MessageSquare,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "XA";

  return (
    <aside
      aria-label="Navigation Sidebar"
      className="shrink-0 flex flex-row md:flex-col items-center justify-between py-3 px-3 md:py-4 md:px-2.5 rounded-2xl bg-sidebar text-sidebar-foreground border border-sidebar-border shadow-xl md:w-16 lg:w-18 md:sticky md:top-0 md:self-start z-30 transition-colors duration-200"
    >
      {/* Top Group: Brand Emblem + Connected Telemetry Pill + Top-Positioned Navigation */}
      <div className="flex md:flex-col items-center gap-2.5 md:gap-3 w-full">
        {/* Brand Emblem */}
        <Tooltip>
          <TooltipTrigger render={<Link href="/dashboard" className="p-2 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 border border-sidebar-border transition-transform active:scale-95 flex items-center justify-center" aria-label="XEROVA Dashboard" />}>
            <div className="relative flex items-center justify-center w-6 h-6">
              <Image
                src="/xerova-icon.svg"
                alt="XEROVA"
                width={24}
                height={24}
                className="w-5 h-5 object-contain"
                priority
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-popover text-popover-foreground border-border text-xs font-mono shadow-md">
            XEROVA Console
          </TooltipContent>
        </Tooltip>

        {/* Connected Threat Feeds Badge */}
        <Tooltip>
          <TooltipTrigger render={<div className="hidden md:flex flex-col items-center justify-center w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary cursor-pointer hover:bg-primary/20 transition-colors" />}>
            <span className="text-[10px] font-mono font-bold leading-none">9+</span>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-popover text-popover-foreground border-border text-xs shadow-md">
            9 Threat Engines Operational
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="hidden md:block w-8 h-px bg-sidebar-border my-1" />

        {/* Primary Navigation Icons — Positioned at TOP */}
        <nav className="flex md:flex-col items-center gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      aria-label={item.title}
                      className={`w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-150 group relative ${
                        isActive
                          ? "bg-foreground text-background shadow-md font-semibold scale-100"
                          : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                      }`}
                    />
                  }
                >
                  <item.icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      isActive ? "scale-105 stroke-[2.3]" : "group-hover:scale-110"
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -left-1 w-1 h-3.5 rounded-r-full bg-primary hidden md:block" />
                  )}
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-popover text-popover-foreground border-border text-xs font-medium px-2.5 py-1 shadow-md"
                >
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>

      {/* Bottom Group: Profile & Sign Out Controls */}
      <div className="flex md:flex-col items-center gap-2 md:mt-6 pt-0 md:pt-3 md:border-t md:border-sidebar-border w-full justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="p-1 rounded-full hover:ring-2 hover:ring-primary/40 transition-all outline-none"
                aria-label="User account menu"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-full border border-sidebar-border">
              <AvatarImage
                src={session?.user?.image || ""}
                alt={session?.user?.name || "Analyst"}
              />
              <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            className="w-52 bg-popover border-border text-popover-foreground rounded-xl shadow-2xl p-1.5"
          >
            <div className="px-2.5 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground truncate">
                {session?.user?.name || "SOC Analyst"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">
                {session?.user?.email || "analyst@xerova.io"}
              </p>
            </div>
            <DropdownMenuItem
              render={<Link href="/settings" className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground hover:bg-accent rounded-lg transition-colors" />}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings &amp; Engines
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border my-1" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="hidden md:flex w-8 h-8 rounded-xl items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                aria-label="Sign out"
              />
            }
          >
            <LogOut className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-popover text-popover-foreground border-border text-xs shadow-md">
            Sign Out
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

export default AppSidebar;
