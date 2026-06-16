"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium text-sm",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    "select-none",
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-sm",
          "active:shadow-sm",
          "focus-visible:ring-2 focus-visible:ring-primary/25",
        ].join(" "),

        secondary: [
          "bg-accent text-accent-foreground",
          "shadow-sm",
          "focus-visible:ring-2 focus-visible:ring-foreground/10",
        ].join(" "),

        outline: [
          "border border-border bg-background",
          "shadow-sm",
          "focus-visible:ring-2 focus-visible:ring-primary/20",
        ].join(" "),

        ghost: [
          "bg-transparent",
          "focus-visible:ring-2 focus-visible:ring-primary/15",
        ].join(" "),

        destructive: [
          "bg-red-500 text-white",
          "shadow-sm shadow-red-500/20",
          "focus-visible:ring-2 focus-visible:ring-red-500/25",
        ].join(" "),

        glow: [
          "bg-primary text-primary-foreground",
          "shadow-md shadow-primary/20",
          "focus-visible:ring-2 focus-visible:ring-primary/30",
        ].join(" "),
      },

      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10 sm:h-10 sm:w-10",
      },

      rounded: {
        md: "rounded-md",
        lg: "rounded-lg",
        pill: "rounded-full",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "pill",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      asChild = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };