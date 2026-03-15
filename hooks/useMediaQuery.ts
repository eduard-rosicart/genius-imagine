"use client";

import { useState, useEffect } from "react";

/**
 * Returns true if the media query matches.
 * SSR-safe: returns `defaultValue` on the server/before hydration.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** < 768px */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)", false);
}

/** 768px – 1023px */
export function useIsTablet() {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)", false);
}

/** >= 1024px */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)", true);
}

/** Anything below desktop (mobile + tablet) */
export function useIsMobileOrTablet() {
  return useMediaQuery("(max-width: 1023px)", false);
}
