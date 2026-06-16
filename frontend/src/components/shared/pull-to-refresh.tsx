"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  /** Distance in px to trigger refresh */
  threshold?: number;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = PULL_THRESHOLD,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) return;

      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || disabled || isRefreshing) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 0) {
        isDragging.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Apply resistance (rubber band effect)
        const resistance = 0.5;
        const distance = Math.min(diff * resistance, MAX_PULL);
        setPullDistance(distance);
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || disabled || isRefreshing) return;
    isDragging.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(40); // Hold at loading position
      try {
        await onRefresh();
      } catch {
        // silently ignore
      }
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh, disabled, isRefreshing]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden transition-all duration-300",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{ height: pullDistance }}
      >
        <RefreshCw
          className={cn(
            "h-5 w-5 text-primary transition-transform",
            isRefreshing && "ptr-spinner"
          )}
          style={
            !isRefreshing
              ? { transform: `rotate(${progress * 360}deg)` }
              : undefined
          }
        />
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-300"
        style={{
          transform: showIndicator
            ? `translateY(0px)`
            : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}