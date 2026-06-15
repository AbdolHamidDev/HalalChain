import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* -----------------------------
   BASE VARIANTS
----------------------------- */
const badgeVariants = cva(
  "inline-flex items-center gap-0 rounded-full px-3 py-1 rounded-full px-3 py-1 text-xs font-medium border relative overflow-hidden transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-800 text-white border-zinc-700",

        success: "bg-emerald-700 text-white border-emerald-600",
        warning: "bg-amber-700 text-white border-amber-600",
        danger: "bg-red-700 text-white border-red-600",
        info: "bg-sky-700 text-white border-sky-600",

        gradientSuccess:
          "bg-emerald-700 text-white border-emerald-600",

        gradientInfo:
          "bg-sky-700 text-white border-sky-600",

        outline:
          "bg-zinc-800 text-white border-zinc-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/* -----------------------------
   DOT COMPONENT (VERCEL STYLE)
----------------------------- */
function StatusDot({ variant }: { variant?: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    info: "bg-sky-400",
    default: "bg-zinc-300",
  };

  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className={`absolute h-full w-full rounded-full ${map[variant ?? "default"]} opacity-40 blur-[1px]`} />
      <span className={`relative h-2 w-2 rounded-full ${map[variant ?? "default"]}`} />
    </span>
  );
}

/* -----------------------------
   PULSE OVERLAY (SHIPPING)
----------------------------- */
function Pulse() {
  return (
    <span className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
  );
}

/* -----------------------------
   PROPS
----------------------------- */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/* -----------------------------
   BADGE COMPONENT
----------------------------- */
function Badge({ className, variant, children, ...props }: BadgeProps) {
  const isPulse =
    variant === "info" || variant === "gradientInfo";

  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        "select-none",
        className
      )}
      {...props}
    >
 

      {/* PULSE (for shipping / in transit) */}
      {isPulse && <Pulse />}

      {/* TEXT */}
      <span className="relative z-10 leading-none">
        {children}
      </span>
    </div>
  );
}

/* -----------------------------
   STATUS MAPPER
----------------------------- */
export function statusVariant(
  status: string
): VariantProps<typeof badgeVariants>["variant"] {
  switch (status) {
    case "ACTIVE":
    case "RECEIVED":
    case "DELIVERED":
      return "success";

    case "INACTIVE":
    case "CANCELLED":
      return "danger";

    case "PENDING":
    case "DRAFT":
      return "warning";

    case "IN_TRANSIT":
    case "SHIPPING":
      return "info";

    case "APPROVED":
      return "gradientSuccess";

    default:
      return "outline";
  }
}

/* -----------------------------
   EXPORT
----------------------------- */
export { Badge, badgeVariants };