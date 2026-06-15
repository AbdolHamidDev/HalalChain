import { TraceabilityTimeline } from "@/components/traceability/traceability-timeline";
import type { TimelineEvent } from "@/components/traceability/traceability-timeline";
import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle, QrCode, Scan } from "lucide-react";

export const metadata: Metadata = {
  title: "Traceability Demo - HalalChain",
  description: "Interactive demo showing how HalalChain's traceability engine works with real seed data.",
};

// Pre-seeded product data (matches backend/prisma/seed.ts)
const demoData = {
  product: {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Organic Coconut Milk",
    sku: "HAL-COCO-001",
  },
  supplier: {
    name: "Halal Foods Malaysia Sdn Bhd",
    country: "Malaysia",
  },
  certificates: [
    {
      certificateNumber: "JAKIM-2024-00123",
      issuedBy: "JAKIM",
      expiryDate: "2026-01-14",
    },
  ],
  shipments: [
    { trackingNumber: "MY-HAL-784521", status: "IN_TRANSIT" },
    { trackingNumber: "MY-HAL-603217", status: "DELIVERED" },
  ],
  timeline: [
    {
      type: "SUPPLIER" as const,
      date: "2024-06-01T00:00:00.000Z",
      title: "Supplier: Halal Foods Malaysia Sdn Bhd",
      description: "Malaysia · ACTIVE",
      metadata: {},
    },
    {
      type: "CERTIFICATE" as const,
      date: "2024-01-15T00:00:00.000Z",
      title: "Certificate: JAKIM-2024-00123",
      description: "Issued by JAKIM · Expires 2026-01-14",
      metadata: {},
    },
    {
      type: "PRODUCT" as const,
      date: "2024-08-01T00:00:00.000Z",
      title: "Product: Organic Coconut Milk",
      description: "SKU: HAL-COCO-001",
      metadata: {},
    },
    {
      type: "SHIPMENT" as const,
      date: "2025-02-10T00:00:00.000Z",
      title: "Shipment: MY-HAL-603217",
      description: "Port Klang, Malaysia → Hai Phong Port, Vietnam · DELIVERED",
      metadata: {},
    },
    {
      type: "INVENTORY" as const,
      date: "2025-03-15T00:00:00.000Z",
      title: "Inventory INBOUND: 200 units",
      description: "Warehouse: HCM Logistics Hub",
      metadata: {},
    },
    {
      type: "INVENTORY" as const,
      date: "2025-04-20T00:00:00.000Z",
      title: "Inventory OUTBOUND: 80 units",
      description: "Warehouse: HCM Logistics Hub",
      metadata: {},
    },
    {
      type: "SHIPMENT" as const,
      date: "2025-04-12T00:00:00.000Z",
      title: "Shipment: MY-HAL-784521",
      description: "Port Klang, Malaysia → Cat Lai Port, Ho Chi Minh City · IN_TRANSIT",
      metadata: {},
    },
    {
      type: "INVENTORY" as const,
      date: "2025-05-01T00:00:00.000Z",
      title: "Inventory INBOUND: 300 units",
      description: "Warehouse: HCM Logistics Hub",
      metadata: {},
    },
  ] satisfies TimelineEvent[],
};

function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400" />
      Valid
    </span>
  );
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-md overflow-hidden ring-1 ring-border/50">
              <Image src="/icon1.png" alt="HalalChain" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-display text-base font-bold tracking-tight">
              HalalChain
            </span>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Halal Supply Chain Transparency
          </p>
        </div>
      </header>

      {/* ── Hero Banner ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-background border-b">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/50 bg-background/50 text-xs text-muted-foreground mb-5">
            <QrCode className="size-3.5" />
            Live Traceability Demo
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight mb-2">
            Product Traceability Timeline
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            This demo shows the complete supply chain journey for a real product
            from our seed database. The data matches the HalalChain traceability
            engine output exactly.
          </p>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Product header */}
        <section className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {demoData.product.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                SKU:{" "}
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {demoData.product.sku}
                </span>
                {" · "}
                {demoData.supplier.name}{" "}
                <span className="text-muted-foreground/60">
                  ({demoData.supplier.country})
                </span>
              </p>
            </div>
            <StatusBadge />
          </div>

          {/* Certificate summary */}
          {demoData.certificates.length > 0 && (
            <div className="mt-4 rounded-lg border bg-card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Halal Certificates
              </h2>
              <ul className="space-y-1.5">
                {demoData.certificates.map((cert) => (
                  <li
                    key={cert.certificateNumber}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 text-sm"
                  >
                    <span className="font-medium">{cert.certificateNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      Issued by {cert.issuedBy} · Expires{" "}
                      {new Date(cert.expiryDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Shipments summary */}
          {demoData.shipments.length > 0 && (
            <div className="mt-4 rounded-lg border bg-card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Shipments
              </h2>
              <ul className="space-y-1.5">
                {demoData.shipments.map((s) => (
                  <li key={s.trackingNumber} className="flex items-center gap-2 text-sm">
                    <Truck className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{s.trackingNumber}</span>
                    <span className="text-xs text-muted-foreground">· {s.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Traceability timeline */}
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
            Supply Chain Timeline
          </h2>
          <TraceabilityTimeline timeline={demoData.timeline} />
        </section>

        {/* QR Code Info */}
        <section className="mt-12 rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Scan className="size-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-base font-semibold tracking-tight">
                Verify via QR Code
              </h3>
              <p className="text-sm text-muted-foreground">
                In production, each product gets a unique QR code on its packaging.
                Consumers scan the code with any smartphone camera to access this
                traceability page instantly — no app or account required.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <CheckCircle className="size-3.5" />
                Verified by HalalChain traceability engine
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="mt-16 border-t py-6 text-center">
        <p className="text-xs text-muted-foreground/60">
          Powered by{" "}
          <span className="font-semibold text-muted-foreground">HalalChain</span>
          {" — "}Halal Supply Chain Transparency Platform
        </p>
      </footer>
    </div>
  );
}

function Truck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}