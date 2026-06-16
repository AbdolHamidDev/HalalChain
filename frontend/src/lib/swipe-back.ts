"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SwipeBackOptions {
  /** Distance in px to trigger navigation back */
  threshold?: number;
  /** Maximum vertical distance before cancelling */
  maxVertical?: number;
  /** Whether the gesture is enabled */
  enabled?: boolean;
}

/**
 * Hook that adds swipe-from-left-edge to go back gesture.
 * Mimics iOS navigation behavior. Only works on mobile touch devices.
 */
export function useSwipeBack({
  threshold = 80,
  maxVertical = 100,
  enabled = true,
}: SwipeBackOptions = {}) {
  const router = useRouter();
  const startX = useRef(0);
  const startY = useRef(0);
  const isActive = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      // Only trigger from left edge (first 20px)
      const touch = e.touches[0];
      if (touch.clientX > 20) return;

      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isActive.current = true;
    },
    [enabled]
  );

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isActive.current) return;
    const touch = e.touches[0];
    const verticalDiff = Math.abs(touch.clientY - startY.current);
    // Cancel if vertical scroll is too much
    if (verticalDiff > maxVertical) {
      isActive.current = false;
    }
  }, [maxVertical]);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!isActive.current) return;
      isActive.current = false;

      const touch = e.changedTouches[0];
      const horizontalDiff = touch.clientX - startX.current;

      if (horizontalDiff >= threshold) {
        router.back();
      }
    },
    [threshold, router]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}