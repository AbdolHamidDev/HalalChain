"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TraceabilityTimeline,
  type TimelineEvent,
} from "@/components/traceability/traceability-timeline";
import { AlertCircle, ArrowLeft, PackageSearch } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TraceabilityResponse {
  product: {
    id: string;
    name: string;
    sku: string;
    description?: string;
  };
  timeline: TimelineEvent[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchTraceability(id: string): Promise<TraceabilityResponse> {
  const res = await fetch(`/api/products/${id}/traceability`);

  if (res.status === 404) {
    throw new NotFoundError("Product not found");
  }

  if (res.status === 403) {
    throw new ForbiddenError("You do not have permission to view this page");
  }

  if (!res.ok) {
    throw new Error("Failed to fetch traceability data");
  }

  return res.json();
}

class NotFoundError extends Error {
  readonly type = "NOT_FOUND" as const;
}

class ForbiddenError extends Error {
  readonly type = "FORBIDDEN" as const;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TraceabilitySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading traceability data">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>

      {/* Timeline skeleton rows */}
      <ol className="list-none space-y-0 p-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="relative flex gap-4">
            {i < 4 && (
              <span className="absolute left-5 top-10 bottom-0 w-px bg-border" aria-hidden="true" />
            )}
            <div className="relative z-10 h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 pb-8 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              <div className="h-3 w-56 animate-pulse rounded bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Error states ─────────────────────────────────────────────────────────────

function NotFoundState({ productId }: { productId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageSearch className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-foreground mb-1">Product not found</h2>
      <p className="text-sm text-muted-foreground mb-6">
        No product with ID <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{productId}</span> could be found.
      </p>
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-12 w-12 text-destructive/70 mb-4" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-foreground mb-1">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TraceabilityPage({ params }: PageProps) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", id, "traceability"],
    queryFn: () => fetchTraceability(id),
    retry: (failureCount, err) => {
      // Don't retry on 404 or 403
      if (err instanceof NotFoundError || err instanceof ForbiddenError) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <TraceabilitySkeleton />
      </div>
    );
  }

  if (error instanceof NotFoundError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <NotFoundState productId={id} />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof ForbiddenError
        ? error.message
        : "Failed to load traceability data. Please try again.";

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState message={message} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {data?.product.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SKU: <span className="font-mono">{data?.product.sku}</span>
          {data?.product.description && (
            <> &middot; {data.product.description}</>
          )}
        </p>
        <p className="mt-2 text-xs text-muted-foreground/70">
          Full supply chain traceability for this product
        </p>
      </div>

      {/* Timeline */}
      <TraceabilityTimeline timeline={data?.timeline ?? []} />
    </div>
  );
}
