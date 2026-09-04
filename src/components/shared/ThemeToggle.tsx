"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "default";
}

export function ThemeToggle({ className, size = "default" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme || "dark") : "dark";
  const isDark = currentTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const label = mounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle theme";

  const dimensions = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className={cn(
        "relative rounded-full flex items-center justify-center cursor-pointer select-none",
        "bg-card hover:bg-accent text-muted-foreground hover:text-foreground",
        "border border-border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "transition-colors duration-200",
        dimensions,
        className
      )}
    >
      <span className="sr-only">{label}</span>

      <motion.div
        key={isDark ? "dark" : "light"}
        initial={
          shouldReduceMotion
            ? undefined
            : { opacity: 0, rotate: isDark ? -45 : 45, scale: 0.75 }
        }
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        exit={
          shouldReduceMotion
            ? undefined
            : { opacity: 0, rotate: isDark ? 45 : -45, scale: 0.75 }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
        }
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Moon className={cn(iconSize, "text-primary")} />
        ) : (
          <Sun className={cn(iconSize, "text-amber-500")} />
        )}
      </motion.div>
    </button>
  );
}

export default ThemeToggle;
