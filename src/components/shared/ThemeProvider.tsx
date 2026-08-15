"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return;
    // Browser extensions (password managers) inject fdprocessedid attributes
    // which cause harmless hydration mismatches — suppress across all args
    const str = args.map(a => (typeof a === 'string' ? a : '')).join(' ');
    if (str.includes('fdprocessedid')) return;
    if (typeof args[0] === 'string' && args[0].includes('A tree hydrated but some attributes')) return;
    orig.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
