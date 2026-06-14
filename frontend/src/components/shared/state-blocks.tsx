"use client";

import {
  AlertCircle,
  Loader2,
  PackageOpen,
  Users,
  ShieldCheck,
  Warehouse,
  ShoppingCart,
  Truck,
  Package,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Loading ─────────────────────────────────────────────────────────────────

export function LoadingState() {
  return (
    <div
      className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-muted/30"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  );
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function TableSkeleton({ columns = 5, rows = 5 }: TableSkeletonProps) {
  return (
    <div
      className="w-full overflow-auto rounded-xl border"
      aria-busy="true"
      aria-label="Loading table data"
    >
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b bg-muted/50">
          <tr className="border-b">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="h-11 px-4">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row} className="border-b">
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col} className="px-4 py-3">
                  <div
                    className="h-3 animate-pulse rounded bg-muted"
                    style={{ width: `${60 + ((row * 3 + col * 7) % 40)}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

// ─── Empty State Config ───────────────────────────────────────────────────────

type EmptyStateVariant =
  | "suppliers"
  | "products"
  | "certificates"
  | "inventory"
  | "inventory-movements"
  | "purchase-orders"
  | "shipments"
  | "warehouses"
  | "reports"
  | "generic";

interface EmptyConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
}

const EMPTY_CONFIG: Record<EmptyStateVariant, EmptyConfig> = {
  suppliers: {
    icon: Users,
    title: "No suppliers yet",
    description:
      "Add your first halal-certified supplier to start building your supply network across Southeast Asia.",
    ctaLabel: "Add Supplier",
  },
  products: {
    icon: Package,
    title: "No products yet",
    description:
      "Add your first halal product to begin tracking SKUs, pricing, and inventory across your warehouses.",
    ctaLabel: "Add Product",
  },
  certificates: {
    icon: ShieldCheck,
    title: "No certificates yet",
    description:
      "Track JAKIM, MUI, CICOT and other halal certifications here. Add your first certificate to monitor compliance and expiry dates.",
    ctaLabel: "Add Certificate",
  },
  inventory: {
    icon: Warehouse,
    title: "No inventory records",
    description:
      "Inventory records are created when stock movements are processed. Add products and process an inbound movement to get started.",
  },
  "inventory-movements": {
    icon: Warehouse,
    title: "No movements recorded",
    description:
      "Stock movements will appear here as inbound receipts and outbound dispatches are processed.",
  },
  "purchase-orders": {
    icon: ShoppingCart,
    title: "No purchase orders yet",
    description:
      "Purchase orders track your procurement workflow from DRAFT → APPROVED → SHIPPING → RECEIVED. Create your first PO to get started.",
    ctaLabel: "New PO",
  },
  shipments: {
    icon: Truck,
    title: "No shipments yet",
    description:
      "Shipments are automatically created when a purchase order is approved. Approve a PO to generate its first shipment.",
  },
  warehouses: {
    icon: Warehouse,
    title: "No warehouses yet",
    description:
      "Add your first warehouse to start tracking inventory by location across your distribution network.",
    ctaLabel: "Add Warehouse",
  },
  reports: {
    icon: BarChart3,
    title: "No report data",
    description:
      "Report data will appear once you have suppliers, products, inventory, and purchase orders in the system.",
  },
  generic: {
    icon: PackageOpen,
    title: "Nothing here yet",
    description: "No records found.",
  },
};

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Use a semantic variant for context-aware messaging */
  variant?: EmptyStateVariant;
  /** Override the title */
  title?: string;
  /** Override the description */
  description?: string;
  /** Override the CTA label */
  ctaLabel?: string;
  /** Called when the CTA button is clicked */
  onAction?: () => void;
  /** Legacy prop — maps to generic variant with custom description */
  message?: string;
}

export function EmptyState({
  variant = "generic",
  title,
  description,
  ctaLabel,
  onAction,
  message,
}: EmptyStateProps) {
  // Support legacy `message` prop
  const config =
    message !== undefined
      ? { ...EMPTY_CONFIG.generic, description: message }
      : EMPTY_CONFIG[variant];

  const Icon = config.icon;
  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;
  const displayCtaLabel = ctaLabel ?? config.ctaLabel;

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center"
      role="status"
      aria-label={displayTitle}
    >
      <Icon
        className="mb-3 h-10 w-10 text-muted-foreground/40"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-foreground">{displayTitle}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
        {displayDescription}
      </p>
      {displayCtaLabel && onAction && (
        <Button
          size="sm"
          className="mt-5"
          onClick={onAction}
          aria-label={displayCtaLabel}
        >
          {displayCtaLabel}
        </Button>
      )}
    </div>
  );
}
