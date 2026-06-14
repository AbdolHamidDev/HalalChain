"use client";

import { useSidebar } from "@/components/layout/sidebar-provider";
import { cn } from "@/lib/utils";

/**
 * Wraps the main content area (header + main).
 * Transitions smoothly when the sidebar collapses / expands.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  // Consuming collapsed just to re-render — the actual width change
  // comes from the sibling sidebar shrinking inside the flex parent.
  // We add transition-all so the flex reflow animates instead of snapping.
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col lg:overflow-hidden",
        "transition-all duration-300 ease-in-out"
      )}
      data-sidebar-collapsed={collapsed}
    >
      {children}
    </div>
  );
}
