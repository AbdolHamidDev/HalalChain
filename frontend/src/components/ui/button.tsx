import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:-translate-y-px hover:bg-primary-hover hover:shadow-primary-hover focus-visible:shadow-focus-ring",
        destructive:
          "border border-destructive bg-transparent text-destructive hover:-translate-y-px hover:bg-destructive/5 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
        outline:
          "border border-border bg-transparent hover:-translate-y-px hover:bg-accent hover:text-accent-foreground focus-visible:shadow-focus-ring",
        secondary:
          "border border-border bg-transparent hover:-translate-y-px hover:bg-accent hover:text-accent-foreground focus-visible:shadow-focus-ring",
        ghost:
          "hover:-translate-y-px hover:bg-accent hover:text-accent-foreground focus-visible:shadow-focus-ring",
        link: "text-primary underline-offset-4 hover:-translate-y-px hover:underline",
      },
      size: {
        default: "h-[38px] px-4",
        sm: "h-8 rounded-md px-3 text-[13px]",
        lg: "h-11 rounded-md px-6",
        icon: "h-[38px] w-[38px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
