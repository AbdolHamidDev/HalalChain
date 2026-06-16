"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a fade-in + slide-up animation on route change.
 * Only triggers on the content container, not the full layout.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevPath.current !== pathname && containerRef.current) {
      // Trigger re-animation
      const el = containerRef.current;
      el.classList.remove("animate-page-in");
      // Force reflow
      void el.offsetHeight;
      el.classList.add("animate-page-in");
      prevPath.current = pathname;
    }
  }, [pathname]);

  return (
    <div
      ref={containerRef}
      className={cn("animate-page-in", className)}
    >
      {children}
    </div>
  );
}