"use client";

import { type ReactNode } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import { useSwipeBack } from "@/lib/swipe-back";

interface DashboardClientProps {
  children?: ReactNode;
}

/**
 * Client wrapper that provides mobile-only behaviors:
 * - Swipe-to-go-back gesture
 * - (Future: other client-side mobile enhancements)
 */
export function DashboardClient({ children }: DashboardClientProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  useSwipeBack({ enabled: isMobile });

  return <>{children}</>;
}