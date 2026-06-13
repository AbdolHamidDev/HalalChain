/**
 * Branded 404 page for the public traceability route.
 * Rendered automatically by Next.js when `notFound()` is called in page.tsx.
 * The HTTP response status will be 404.
 */
export default function ProductNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* HalalChain logo */}
      <div className="flex items-center gap-2" aria-label="HalalChain">
        <span className="text-2xl leading-none" aria-hidden="true">
          🌙
        </span>
        <span className="text-xl font-bold tracking-tight text-foreground">
          HalalChain
        </span>
      </div>

      {/* 404 content */}
      <div className="mt-12">
        <p className="text-7xl font-extrabold text-muted-foreground/30 select-none">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Product not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
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
