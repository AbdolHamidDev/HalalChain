"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ───────────────────────────────
 * Table Container
 * ─────────────────────────────── */
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    stickyHeader?: boolean;
    density?: "sm" | "md" | "lg";
    zebra?: boolean;
  }
>(
  (
    {
      className,
      stickyHeader = false,
      density = "md",
      zebra = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full overflow-auto rounded-xl border bg-card">
        <table
          ref={ref}
          data-density={density}
          data-zebra={zebra ? "true" : "false"}
          className={cn(
            "w-full caption-bottom text-sm",
            stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10",
            zebra && "[&_tbody_tr:nth-child(even)]:bg-muted/40",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = "Table";

/* ───────────────────────────────
 * Header
 * ─────────────────────────────── */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-muted/60 text-muted-foreground",
      "[&_tr]:border-b",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

/* ───────────────────────────────
 * Body
 * ─────────────────────────────── */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      "text-foreground",
      className
    )}
    {...props}
  />
));
TableBody.displayName = "TableBody";

/* ───────────────────────────────
 * Footer
 * ─────────────────────────────── */
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/40 font-medium text-foreground",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

/* ───────────────────────────────
 * Row
 * ─────────────────────────────── */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    data-state={(props as any)["data-state"]}
    className={cn(
      "border-b transition-colors",
      "hover:bg-accent/60",
      "data-[state=selected]:bg-accent",
      "focus-within:bg-accent/40",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

/* ───────────────────────────────
 * Head Cell
 * ─────────────────────────────── */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-4 h-11 text-left align-middle font-medium",
      "text-xs uppercase tracking-wider text-muted-foreground",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

/* ───────────────────────────────
 * Cell
 * ─────────────────────────────── */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3 align-middle text-sm",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

/* ───────────────────────────────
 * Caption
 * ─────────────────────────────── */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-3 text-sm text-muted-foreground text-center",
      className
    )}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};