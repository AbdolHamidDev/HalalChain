"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────────────── Root ───────────────── */
const DialogRoot = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/* ───────────────── Overlay (CLEAN SaaS) ───────────────── */
const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/50 backdrop-blur-[2px]",

      /* NO fancy animation noise */
      "data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
      "transition-none",

      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

/* ───────────────── Content (SaaS Card Core) ───────────────── */
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />

    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50",
        /* Mobile: full-screen with safe areas */
        "inset-0 m-0 w-full h-full rounded-none border-0 p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-y-auto",
        /* Desktop: centered card, auto-height, no scroll */
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:h-auto sm:overflow-y-visible",
        "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-border/70 sm:p-6",
        "sm:shadow-[0_12px_40px_rgba(0,0,0,0.12)]",

        "bg-background",
        "transition-none",

        className
      )}
      {...props}
    >
      {children}

      {/* Close button (minimal, no hover effect) */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4",
          "text-muted-foreground",
          "opacity-70",

          /* only active feedback */
          "active:opacity-100 active:scale-95",

          "transition-none"
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

/* ───────────────── Header ───────────────── */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 text-left mb-4",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/* ───────────────── Footer ───────────────── */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/* ───────────────── Title ───────────────── */
const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-[15px] font-semibold tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

/* ───────────────── Description ───────────────── */
const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "text-sm leading-relaxed text-muted-foreground",
      className
    )}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/* ───────────────── Simple Wrapper ───────────────── */
interface SimpleDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: SimpleDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {children}
      </DialogContent>
    </DialogRoot>
  );
}

/* ───────────────── Exports ───────────────── */
export {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};