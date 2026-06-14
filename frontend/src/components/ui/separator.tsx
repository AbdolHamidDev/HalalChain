"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ───────────────── Variants ───────────────── */

const separatorVariants = cva(
  "shrink-0 transition-colors data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
  {
    variants: {
      variant: {
        solid: "bg-border",
        dashed: "bg-transparent border-t border-dashed border-border",
        dotted: "bg-transparent border-t border-dotted border-border",
        faded:
          "bg-gradient-to-r from-transparent via-border to-transparent",
        gradient:
          "bg-gradient-to-r from-transparent via-primary/30 to-transparent",
      },
      size: {
        thin: "data-[orientation=horizontal]:h-[1px] data-[orientation=vertical]:w-[1px]",
        normal: "data-[orientation=horizontal]:h-[2px] data-[orientation=vertical]:w-[2px]",
        thick: "data-[orientation=horizontal]:h-[4px] data-[orientation=vertical]:w-[4px]",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "thin",
    },
  }
);

/* ───────────────── Base Separator ───────────────── */

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    VariantProps<typeof separatorVariants> {}

const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = "horizontal", variant, size, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    orientation={orientation}
    className={cn(
      separatorVariants({ variant, size }),
      className
    )}
    {...props}
  />
));

Separator.displayName = "Separator";

/* ───────────────── Label Separator (Pro UX) ───────────────── */

interface SeparatorWithLabelProps extends SeparatorProps {
  label?: React.ReactNode;
}

const SeparatorWithLabel = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorWithLabelProps
>(({ label, className, ...props }, ref) => {
  if (!label) return <Separator ref={ref} className={className} {...props} />;

  return (
    <div className="flex items-center gap-3 w-full">
      <Separator ref={ref} className="flex-1" {...props} />
      
      <span className="text-xs text-muted-foreground px-2 select-none">
        {label}
      </span>

      <Separator className="flex-1" {...props} />
    </div>
  );
});

SeparatorWithLabel.displayName = "SeparatorWithLabel";

export { Separator, SeparatorWithLabel };