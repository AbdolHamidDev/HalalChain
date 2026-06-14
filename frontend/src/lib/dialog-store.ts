import { create } from "zustand";

export type DialogType = "confirm" | "info" | "warning" | "destructive";

export type DialogPayload = {
  id: string;
  type: DialogType;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogState = {
  queue: DialogPayload[];
  current?: DialogPayload;
  resolveMap: Record<string, (value: boolean) => void>;

  open: (payload: Omit<DialogPayload, "id">) => Promise<boolean>;
  close: (id: string, result: boolean) => void;
};

export const useDialogStore = create<DialogState>((set, get) => ({
  queue: [],
  current: undefined,
  resolveMap: {},

  open: (payload) => {
    const id = crypto.randomUUID();
    const dialog: DialogPayload = { id, ...payload };

    return new Promise<boolean>((resolve) => {
      set((state) => ({
        queue: [...state.queue, dialog],
        // Only promote to current if nothing is showing yet
        current: state.current ?? dialog,
        resolveMap: { ...state.resolveMap, [id]: resolve },
      }));
    });
  },

  close: (id, result) => {
    const { resolveMap, queue } = get();

    // Resolve the promise for this dialog
    resolveMap[id]?.(result);

    // Remove from queue; promote next item if exists
    const newQueue = queue.filter((d) => d.id !== id);
    const newResolveMap = { ...resolveMap };
    delete newResolveMap[id];

    set({
      queue: newQueue,
      current: newQueue[0],
      resolveMap: newResolveMap,
    });
  },
}));
