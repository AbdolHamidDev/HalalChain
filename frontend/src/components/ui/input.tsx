import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-[38px] w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-[14px]",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-neutral",
        "focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-focus-ring",
        "aria-invalid:border-destructive aria-invalid:focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
