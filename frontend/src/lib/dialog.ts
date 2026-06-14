import { useDialogStore } from "./dialog-store";
import type { DialogType } from "./dialog-store";

/**
 * Headless dialog API — call from anywhere (hooks, services, route handlers).
 *
 * @example
 * const ok = await dialog.confirm({
 *   title: "Delete supplier?",
 *   description: "This cannot be undone.",
 *   type: "destructive",
 *   confirmLabel: "Delete",
 * });
 * if (!ok) return;
 */
export const dialog = {
  confirm: (options: {
    title: string;
    description?: string;
    type?: DialogType;
    confirmLabel?: string;
    cancelLabel?: string;
  }): Promise<boolean> => {
    return useDialogStore.getState().open({
      type: options.type ?? "confirm",
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel,
      cancelLabel: options.cancelLabel,
    });
  },
};
