"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileTableScrollProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that adds a fade-out scroll indicator on mobile
 * when content is horizontally scrollable.
 */
export function MobileTableScroll({ children, className }: MobileTableScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };

    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className={cn("relative sm:hidden", className)}>
      <div
        ref={scrollRef}
        className="overflow-x-auto overscroll-x-contain -mx-4 px-4"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>

      {/* Left fade */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
      )}

      {/* Right fade */}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
      )}
    </div>
  );
}