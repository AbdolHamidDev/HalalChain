"use client";

import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoAlertDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if we should show the alert
    const showAlert = sessionStorage.getItem("show_demo_alert");
    if (showAlert === "true") {
      setIsOpen(true);
      sessionStorage.removeItem("show_demo_alert");
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl border border-border/70 bg-background p-6 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-[15px] font-semibold tracking-tight">Chế độ Demo</h2>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              ⚠️ <span className="font-semibold">Chức năng này không khả dụng trong chế độ demo.</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Đây là phiên làm việc tạm thời. Các thay đổi sẽ không được lưu vào hệ thống.
            </p>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 text-muted-foreground opacity-70 active:opacity-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
