"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
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
        <span className="relative inline-flex h-5 w-5 shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="sr-only"
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card transition-colors",
              "group-has-[:checked]:border-primary group-has-[:checked]:bg-primary",
              "group-has-[:focus-visible]:shadow-focus-ring"
            )}
          >
            <Check className="h-3 w-3 text-primary-foreground opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
          </span>
        </span>
        {label ? <span>{label}</span> : null}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
