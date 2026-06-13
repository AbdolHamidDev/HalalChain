import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  TraceabilityTimeline,
  type TimelineEvent,
} from "@/components/traceability/traceability-timeline";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Certificate {
  certificateNumber: string;
  expiryDate: string;
  issuedBy: string;
}

interface Shipment {
  trackingNumber: string;
  status: string;
}

interface PublicTraceabilityResponse {
  product: { id: string; name: string; sku: string };
  supplier: { name: string; country: string };
  certificates: Certificate[];
  shipments: Shipment[];
  timeline: TimelineEvent[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchPublicTraceability(
  id: string
): Promise<PublicTraceabilityResponse | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/public/products/${id}/traceability`,
      {
        // No caching — traceability data should be fresh
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`Unexpected response: ${res.status}`);
    }

    return res.json() as Promise<PublicTraceabilityResponse>;
  } catch (err) {
    // Network or parse errors — surface them as null so we render 404
    // rather than crashing the server component
    console.error("[PublicTraceabilityPage] fetch error:", err);
    return null;
  }
}

// ─── Status badge logic ───────────────────────────────────────────────────────

type CertStatus = "Valid" | "Expired";

function getCertStatus(certificates: Certificate[]): CertStatus {
  if (certificates.length === 0) return "Expired";

  // Find the most recent certificate by expiryDate (latest expiry = most recent)
  const sorted = [...certificates].sort(
    (a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
  );
  const latest = sorted[0];
  const isValid = new Date(latest.expiryDate) >= new Date();
  return isValid ? "Valid" : "Expired";
}

// ─── Status Badge component ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: CertStatus }) {
  const isValid = status === "Valid";
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        isValid
          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      ].join(" ")}
      role="status"
      aria-label={`Halal certificate status: ${status}`}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isValid ? "bg-green-600 dark:bg-green-400" : "bg-red-600 dark:bg-red-400",
        ].join(" ")}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

// ─── HalalChain Logo ──────────────────────────────────────────────────────────

function HalalChainLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="HalalChain">
      <span className="text-2xl leading-none" aria-hidden="true">
        🌙
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        HalalChain
      </span>
    </div>
  );
}

// ─── Branded 404 ─────────────────────────────────────────────────────────────

function Branded404() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <HalalChainLogo />
      <div className="mt-12">
        <p className="text-7xl font-extrabold text-muted-foreground/30 select-none">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Product not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          The product you are looking for does not exist or the QR code may be
          outdated. Please contact your supplier for an updated link.
        </p>
      </div>
      <p className="mt-16 text-xs text-muted-foreground/50">
        Powered by HalalChain — Halal Supply Chain Transparency
      </p>
    </div>
  );
}

// ─── Metadata ────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPublicTraceability(id);

  if (!data) {
    return { title: "Product Not Found — HalalChain" };
  }

  return {
    title: `${data.product.name} — HalalChain Traceability`,
    description: `View the full halal supply chain traceability for ${data.product.name} (SKU: ${data.product.sku}) supplied by ${data.supplier.name}.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicTraceabilityPage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchPublicTraceability(id);

  if (!data) {
    // Use Next.js notFound() to trigger the 404 response with correct HTTP status
    notFound();
  }

  const certStatus = getCertStatus(data.certificates);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <HalalChainLogo />
          <p className="text-xs text-muted-foreground hidden sm:block">
            Halal Supply Chain Transparency
          </p>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Product header */}
        <section aria-labelledby="product-heading" className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1
                id="product-heading"
                className="text-2xl font-bold tracking-tight text-foreground"
              >
                {data.product.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                SKU:{" "}
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {data.product.sku}
                </span>
                {" · "}
                {data.supplier.name}{" "}
                <span className="text-muted-foreground/60">
                  ({data.supplier.country})
                </span>
              </p>
            </div>

            {/* Halal status badge */}
            <StatusBadge status={certStatus} />
          </div>

          {/* Certificates summary */}
          {data.certificates.length > 0 && (
            <div className="mt-4 rounded-lg border bg-card p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Halal Certificates
              </h2>
              <ul className="space-y-1.5">
                {data.certificates.map((cert) => (
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
        </section>

        {/* Traceability timeline */}
        <section aria-labelledby="timeline-heading">
          <h2
            id="timeline-heading"
            className="mb-4 text-lg font-semibold tracking-tight text-foreground"
          >
            Supply Chain Timeline
          </h2>
          <TraceabilityTimeline timeline={data.timeline} />
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mt-16 border-t py-6 text-center">
        <p className="text-xs text-muted-foreground/60">
          Powered by{" "}
          <span className="font-semibold text-muted-foreground">HalalChain</span>{" "}
          — Halal Supply Chain Transparency Platform
        </p>
      </footer>
    </div>
  );
}


