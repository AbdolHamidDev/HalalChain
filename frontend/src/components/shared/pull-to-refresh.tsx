"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptics";

interface PullToRefreshProps {
  /** The content to wrap */
  children: ReactNode;
  /** Async function called when user pulls to refresh */
  onRefresh: () => Promise<void>;
  /** Threshold in pixels before refresh triggers (default: 80) */
  threshold?: number;
  /** Minimum pull distance to activate visual feedback */
  pullDistance?: number;
  /** Extra class names */
  className?: string;
}

/**
 * Mobile pull-to-refresh container.
 * Pull down to trigger refresh. Shows a spinner at the top.
 * Only activates on touch devices; does nothing on desktop.
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  pullDistance = 10,
  className,
}: PullToRefreshProps) {
  const [state, setState] = useState<"idle" | "pulling" | "ready" | "refreshing">("idle");
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Only activate if the container is scrolled to the top
      if (containerRef.current && containerRef.current.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        currentY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current) return;
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > pullDistance) {
        const progress = Math.min(diff / threshold, 1);
        setPullProgress(progress);

        if (diff >= threshold) {
          setState("ready");
        } else {
          setState("pulling");
        }

        // Optional: subtle haptic at 100%
        if (progress >= 1) {
          hapticImpact();
        }
      } else {
        setPullProgress(0);
        setState("idle");
      }
    },
    [threshold, pullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const diff = currentY.current - startY.current;
    if (diff >= threshold) {
      setState("refreshing");
      setPullProgress(0);
      try {
        await onRefresh();
      } finally {
        setState("idle");
      }
    } else {
      setPullProgress(0);
      setState("idle");
    }
  }, [threshold, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const isRefreshing = state === "refreshing";

  return (
    <div ref={containerRef} className={cn("relative overflow-y-auto overscroll-contain", className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          "flex items-center justify-center pointer-events-none transition-all duration-200 ease-out",
          isRefreshing ? "h-16 opacity-100" : "h-0",
          state === "pulling" && pullProgress > 0 && !isRefreshing && "h-16 opacity-100"
        )}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isRefreshing ? (
            <>
              <div className="ptr-spinner h-4 w-4 rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span>Refreshing...</span>
            </>
          ) : state === "ready" ? (
            <span className="font-medium text-primary">Release to refresh</span>
          ) : (
            <>
              <svg
                className="h-4 w-4 transition-transform"
                style={{ transform: `rotate(${pullProgress * 180}deg)` }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12l7-7 7 7" />
              </svg>
              <span>Pull to refresh</span>
            </>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}