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
import { useTranslation } from "@/i18n/hooks";
import { useMemo } from "react";

// ─── Loading ─────────────────────────────────────────────────────────────────

export function LoadingState() {
  const { t } = useTranslation();
  return (
    <div
      className="flex h-48 items-center justify-center rounded-xl border border-dashed bg-muted/30"
      aria-live="polite"
      aria-label={t("common.loading")}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        <p className="text-sm">{t("common.loading")}</p>
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
  const { t } = useTranslation();
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
          {t("common.retry")}
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
  titleKey: string;
  descriptionKey: string;
  ctaLabelKey?: string;
}

const EMPTY_CONFIG: Record<EmptyStateVariant, EmptyConfig> = {
  suppliers: {
    icon: Users,
    titleKey: "suppliers.empty.title",
    descriptionKey: "suppliers.empty.description",
    ctaLabelKey: "suppliers.addSupplier",
  },
  products: {
    icon: Package,
    titleKey: "products.empty.title",
    descriptionKey: "products.empty.description",
    ctaLabelKey: "products.addProduct",
  },
  certificates: {
    icon: ShieldCheck,
    titleKey: "certificates.empty.title",
    descriptionKey: "certificates.empty.description",
    ctaLabelKey: "certificates.addCertificate",
  },
  inventory: {
    icon: Warehouse,
    titleKey: "inventory.empty.title",
    descriptionKey: "inventory.empty.description",
  },
  "inventory-movements": {
    icon: Warehouse,
    titleKey: "inventory.empty.movementsTitle",
    descriptionKey: "inventory.empty.movementsDescription",
  },
  "purchase-orders": {
    icon: ShoppingCart,
    titleKey: "purchaseOrders.empty.title",
    descriptionKey: "purchaseOrders.empty.description",
    ctaLabelKey: "purchaseOrders.newPO",
  },
  shipments: {
    icon: Truck,
    titleKey: "shipments.empty.title",
    descriptionKey: "shipments.empty.description",
  },
  warehouses: {
    icon: Warehouse,
    titleKey: "warehouses.empty.title",
    descriptionKey: "warehouses.empty.description",
    ctaLabelKey: "warehouses.addWarehouse",
  },
  reports: {
    icon: BarChart3,
    titleKey: "reports.empty.title",
    descriptionKey: "reports.empty.description",
  },
  generic: {
    icon: PackageOpen,
    titleKey: "common.noResults",
    descriptionKey: "common.noData",
  },
};

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onAction?: () => void;
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
  const { t } = useTranslation();

  const config = useMemo(() => {
    if (message !== undefined) {
      return { ...EMPTY_CONFIG.generic };
    }
    return EMPTY_CONFIG[variant];
  }, [variant, message]);

  const Icon = config.icon;

  // Support legacy `message` prop and overrides
  const displayTitle = title ?? (message !== undefined ? message : t(config.titleKey as any));
  const displayDescription = description ?? (message !== undefined ? undefined : t(config.descriptionKey as any));
  const displayCtaLabel = ctaLabel ?? (config.ctaLabelKey ? t(config.ctaLabelKey as any) : undefined);

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center"
      role="status"
      aria-label={typeof displayTitle === "string" ? displayTitle : undefined}
    >
      <Icon
        className="mb-3 h-10 w-10 text-muted-foreground/40"
        aria-hidden="true"
      />
      <p className="text-sm font-semibold text-foreground">{displayTitle}</p>
      {displayDescription && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
          {displayDescription}
        </p>
      )}
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