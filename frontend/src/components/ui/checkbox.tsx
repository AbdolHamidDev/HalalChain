"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
}

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-3 text-small font-medium text-foreground",
        props.disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <CheckboxPrimitive.Root
        ref={ref}
        id={inputId}
        className={cn(
          "relative flex h-5 w-5 shrink-0 items-center justify-center",
          "rounded-full border border-border bg-card",
          "transition-colors",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "focus-visible:outline-none focus-visible:shadow-focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3 w-3 text-primary-foreground" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? <span>{label}</span> : null}
    </label>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
