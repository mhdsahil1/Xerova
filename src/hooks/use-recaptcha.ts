"use client";

import { useEffect, useCallback } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useRecaptcha(action: string = "register") {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return;

    // Check if reCAPTCHA script is already appended
    const scriptId = "google-recaptcha-v3";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [siteKey]);

  const executeRecaptcha = useCallback(async (): Promise<string | null> => {
    if (!siteKey || typeof window === "undefined") {
      return null;
    }

    return new Promise((resolve) => {
      if (!window.grecaptcha) {
        console.warn("reCAPTCHA script has not loaded yet");
        resolve(null);
        return;
      }

      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(siteKey, { action });
          resolve(token);
        } catch (error) {
          console.warn("reCAPTCHA execute failed:", error);
          resolve(null);
        }
      });
    });
  }, [siteKey, action]);

  return { executeRecaptcha, siteKey };
}
