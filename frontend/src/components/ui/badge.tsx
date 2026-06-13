import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-caption font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-muted-foreground",
        secondary:
          "border-transparent bg-secondary text-muted-foreground",
        active:
          "border-transparent bg-primary text-primary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        success:
          "border-transparent bg-success/10 text-success",
        warning:
          "border-transparent bg-warning/10 text-warning",
        danger:
          "border-transparent bg-destructive/10 text-destructive",
        info:
          "border-transparent bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function statusVariant(
  status: string
): VariantProps<typeof badgeVariants>["variant"] {
  switch (status) {
    case "ACTIVE":
    case "RECEIVED":
    case "DELIVERED":
      return "success";
    case "INACTIVE":
    case "DELAYED":
    case "CANCELLED":
      return "danger";
    case "DRAFT":
    case "PENDING":
      return "warning";
    case "APPROVED":
    case "IN_TRANSIT":
    case "SHIPPING":
      return "info";
    case "EXPIRED":
      return "warning";
    default:
      return "outline";
  }
}

export { Badge, badgeVariants };
