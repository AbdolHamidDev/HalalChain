"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "inline-flex items-center gap-1 select-none leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "text-sm font-medium text-foreground",
        muted: "text-sm font-medium text-muted-foreground",
        subtle: "text-xs font-medium text-muted-foreground",
      },
      state: {
        default: "",
        error: "text-red-500",
        success: "text-green-500",
      },
      disabled: {
        true: "cursor-not-allowed opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
      disabled: false,
    },
  }
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
}

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  LabelProps
>(
  (
    {
      className,
      variant,
      state,
      disabled,
      required,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants({ variant, state, disabled }), className)}
        data-disabled={disabled || undefined}
        {...props}
      >
        {children}

        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </LabelPrimitive.Root>
    );
  }
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };