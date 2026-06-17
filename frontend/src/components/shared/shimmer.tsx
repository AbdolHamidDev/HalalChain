"use client";

import { cn } from "@/lib/utils";

/**
 * Shimmer loading placeholder with animated gradient.
 * Use as a drop-in replacement for `animate-pulse` blocks
 * to give a more polished loading experience.
 */
export function Shimmer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.5s_ease-in-out_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-muted-foreground/5 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

/**
 * Shimmer card that mimics the shape of a dashboard KPI card.
 */
export function ShimmerCard() {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-8 w-8 rounded-xl" />
      </div>
      <div className="mt-4 space-y-2">
        <Shimmer className="h-7 w-20" />
        <Shimmer className="h-3 w-32" />
      </div>
    </div>
  );
}

/**
 * Shimmer chart placeholder matching chart card dimensions.
 */
export function ShimmerChart() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Shimmer className="mb-4 h-4 w-28" />
      <Shimmer className="h-56 w-full" />
    </div>
  );
}