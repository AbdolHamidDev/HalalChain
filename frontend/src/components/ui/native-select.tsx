"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface NativeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface NativeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: NativeSelectOption[];
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Hybrid select that renders native <select> on mobile (better touch UX)
 * and can fall back to custom components on desktop.
 */
export function NativeSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  id,
  required,
  disabled,
}: NativeSelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={cn(
          "flex h-[42px] w-full appearance-none items-center rounded-lg border bg-card px-3 pr-10 text-sm text-foreground",
          "border-input/70",
          "focus:border-primary/60 focus:ring-2 focus:ring-primary/15 focus:outline-none",
          "active:border-primary/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}