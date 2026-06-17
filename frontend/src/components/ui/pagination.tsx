"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Called with the new page number */
  onPageChange: (page: number) => void;
  /** Optional total items count for display */
  totalItems?: number;
  /** Optional page size */
  pageSize?: number;
  className?: string;
}

/**
 * Reusable pagination component with page numbers, prev/next, first/last.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate visible page numbers
  const getVisiblePages = (): (number | "ellipsis")[] => {
    const visible: (number | "ellipsis")[] = [];
    const delta = 1; // pages before/after current

    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(totalPages - 1, page + delta);

    visible.push(1);

    if (rangeStart > 2) {
      visible.push("ellipsis");
    }

    for (let i = rangeStart; i <= rangeEnd; i++) {
      visible.push(i);
    }

    if (rangeEnd < totalPages - 1) {
      visible.push("ellipsis");
    }

    if (totalPages > 1) {
      visible.push(totalPages);
    }

    return visible;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}>
      {/* Info */}
      {totalItems !== undefined && pageSize !== undefined && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {Math.min((page - 1) * pageSize + 1, totalItems)}
            {" – "}
            {Math.min(page * pageSize, totalItems)}
          </span>
          {" "}of{" "}
          <span className="font-medium text-foreground">{totalItems}</span>
        </p>
      )}

      {/* Controls */}
      <nav aria-label="Pagination" className="flex items-center gap-1">
        {/* First */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Prev */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Page numbers */}
        {visiblePages.map((p, idx) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground/40 select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}