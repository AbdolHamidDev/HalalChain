"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbSegment {
  label: string;
  href: string;
}

/**
 * Generates breadcrumbs from the current pathname.
 * Uses navigation.ts config to resolve display labels,
 * falls back to humanized path segments.
 */
function useBreadcrumbs(): BreadcrumbSegment[] {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    // Build breadcrumb trail
    const crumbs: BreadcrumbSegment[] = [];
    let accumulated = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      accumulated += `/${segment}`;

      // Humanize: dash-case → Title Case
      const label = segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      crumbs.push({ label, href: accumulated });
    }

    return crumbs;
  }, [pathname]);
}

interface BreadcrumbsProps {
  className?: string;
  /** Optional: override segments for dynamic routes (e.g. detail pages) */
  segments?: BreadcrumbSegment[];
}

export function Breadcrumbs({ className, segments }: BreadcrumbsProps) {
  const autoSegments = useBreadcrumbs();
  const crumbs = segments ?? autoSegments;

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-muted"
          >
            <Home className="h-3 w-3" />
            <span className="sr-only sm:not-sr-only">Dashboard</span>
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 shrink-0 opacity-40" aria-hidden="true" />
              {isLast ? (
                <span className="max-w-[160px] truncate rounded-md px-1.5 py-1 font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="max-w-[120px] truncate rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-muted"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}