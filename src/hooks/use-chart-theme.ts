"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export interface ChartTheme {
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  gridColor: string;
  axisColor: string;
  severityCritical: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
  severityInfo: string;
}

const DARK_DEFAULTS: ChartTheme = {
  tooltipBg: "oklch(0.16 0.02 260)",
  tooltipBorder: "oklch(0.26 0.025 260)",
  tooltipText: "oklch(0.93 0.01 260)",
  gridColor: "oklch(0.3 0.02 260)",
  axisColor: "oklch(0.5 0.02 260)",
  severityCritical: "oklch(0.63 0.25 25)",
  severityHigh: "oklch(0.7 0.18 50)",
  severityMedium: "oklch(0.8 0.15 85)",
  severityLow: "oklch(0.7 0.12 230)",
  severityInfo: "oklch(0.72 0.15 160)",
};

const LIGHT_DEFAULTS: ChartTheme = {
  tooltipBg: "oklch(1 0 0)",
  tooltipBorder: "oklch(0.91 0.005 260)",
  tooltipText: "oklch(0.145 0 0)",
  gridColor: "oklch(0.91 0.005 260)",
  axisColor: "oklch(0.5 0.02 260)",
  severityCritical: "oklch(0.55 0.25 25)",
  severityHigh: "oklch(0.6 0.2 50)",
  severityMedium: "oklch(0.6 0.18 85)",
  severityLow: "oklch(0.55 0.14 230)",
  severityInfo: "oklch(0.55 0.15 160)",
};

function readCSSVar(varName: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/**
 * Reads chart theme CSS custom properties from the DOM.
 * Falls back to hardcoded defaults if vars aren't available yet (SSR/hydration).
 * Re-reads on theme change to keep Recharts in sync.
 */
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState<ChartTheme>(
    resolvedTheme === "light" ? LIGHT_DEFAULTS : DARK_DEFAULTS
  );

  useEffect(() => {
    // Small delay to let CSS vars settle after theme toggle
    const timer = setTimeout(() => {
      const tooltipBg = readCSSVar("--chart-tooltip-bg");
      if (tooltipBg) {
        setTheme({
          tooltipBg,
          tooltipBorder: readCSSVar("--chart-tooltip-border"),
          tooltipText: readCSSVar("--chart-tooltip-text"),
          gridColor: readCSSVar("--chart-grid"),
          axisColor: readCSSVar("--chart-axis"),
          severityCritical: readCSSVar("--severity-critical"),
          severityHigh: readCSSVar("--severity-high"),
          severityMedium: readCSSVar("--severity-medium"),
          severityLow: readCSSVar("--severity-low"),
          severityInfo: readCSSVar("--severity-info"),
        });
      } else {
        // Fallback if CSS vars not loaded
        setTheme(resolvedTheme === "light" ? LIGHT_DEFAULTS : DARK_DEFAULTS);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [resolvedTheme]);

  return theme;
}
