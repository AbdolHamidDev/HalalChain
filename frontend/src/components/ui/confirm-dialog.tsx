"use client";

import * as React from "react";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogStore } from "@/lib/dialog-store";

// ---------------------------------------------------------------------------
// Shared dialog shell styles
// ---------------------------------------------------------------------------

const CONTENT_CLS = cn(
  "sm:w-full sm:max-w-md rounded-2xl p-6",
  "border border-border bg-background",
  "shadow-2xl shadow-black/20",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "transition-none"
);

// ---------------------------------------------------------------------------
// UltraDialogHost — mount once in layout.tsx
// Renders the current dialog from the global store. Queued dialogs play in order.
// ---------------------------------------------------------------------------

export function UltraDialogHost() {
  const { current, close } = useDialogStore();

  if (!current) return null;

  const isDestructive = current.type === "destructive";

  return (
    <DialogRoot
      open={!!current}
      onOpenChange={(open) => {
        if (!open) close(current.id, false);
      }}
    >
      <DialogContent className={CONTENT_CLS}>
        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isDestructive
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-primary/10 border border-primary/20"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  isDestructive ? "text-red-500" : "text-primary"
                )}
              />
            </div>

            <DialogTitle className="text-base font-semibold text-foreground">
              {current.title}
            </DialogTitle>
          </div>
        </DialogHeader>

        {current.description && (
          <DialogDescription className="mt-2 pl-[52px] text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </DialogDescription>
        )}

        <DialogFooter className="mt-6 flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            className="rounded-xl transition-none active:scale-[0.98]"
            onClick={() => close(current.id, false)}
          >
            {current.cancelLabel ?? "Cancel"}
          </Button>

          <Button
            className={cn(
              "rounded-xl transition-none active:scale-[0.98]",
              isDestructive && "bg-red-600 text-white hover:bg-red-700"
            )}
            onClick={() => close(current.id, true)}
          >
            {current.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

// ---------------------------------------------------------------------------
// ConfirmDialog — legacy prop-driven component kept for backward compatibility.
// Existing usages still work; new code should use `dialog.confirm()` instead.
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isPending = false,
  variant = "destructive",
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isDestructive = variant === "destructive";

  return (
    <DialogRoot open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className={CONTENT_CLS}>
        <DialogHeader className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isDestructive
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-primary/10 border border-primary/20"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  isDestructive ? "text-red-500" : "text-primary"
                )}
              />
            </div>

            <DialogTitle className="text-base font-semibold text-foreground">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <DialogDescription
          className={cn(
            "mt-2 pl-[52px]",
            "text-sm text-muted-foreground leading-relaxed"
          )}
        >
          {description}
        </DialogDescription>

        <DialogFooter
          className={cn(
            "mt-6 flex justify-end gap-2 pt-4",
            "border-t border-border"
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading || isPending}
            className="rounded-xl transition-none active:scale-[0.98]"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || isPending}
            className={cn(
              "rounded-xl transition-none active:scale-[0.98]",
              isDestructive && "bg-red-600 text-white hover:bg-red-700"
            )}
          >
            {loading || isPending ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
