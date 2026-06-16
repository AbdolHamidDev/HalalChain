"use client";

import { useEffect } from "react";

/**
 * Dynamically updates the <meta name="theme-color"> tag
 * to match the current page context on mobile.
 */
export function useMobileStatusBar(color: string) {
  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = color;
    return () => {
      meta.content = prev;
    };
  }, [color]);
}