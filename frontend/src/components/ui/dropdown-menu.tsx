"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* =========================================================
   CONTEXT (active + motion tracking)
========================================================= */
const ActiveItemContext = React.createContext<string | null>(null);

/* =========================================================
   MAGNETIC HOOK (LEVEL 3 FEATURE)
========================================================= */
function useMagnetic() {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;

    el.style.transform = `translateX(${x * 0.08}px) scale(1.02)`;
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translateX(0px) scale(1)";
  };

  return { ref, onMouseMove, reset };
}

/* =========================================================
   CONTENT (LIQUID GLASS + DEPTH)
========================================================= */
const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 10, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[15rem] overflow-hidden rounded-2xl border",
        "bg-white/10 dark:bg-black/30 backdrop-blur-2xl",
        "p-1 text-foreground",

        // ultra depth shadow
        "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)]",

        // animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",

        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName =
  DropdownMenuPrimitive.Content.displayName;

/* =========================================================
   ITEM (MAGNETIC + GRADIENT ACTIVE + TRACKING FEEL)
========================================================= */
const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    value?: string;
  }
>(({ className, value, ...props }, ref) => {
  const active = React.useContext(ActiveItemContext);
  const isActive = value && active === value;

  const mag = useMagnetic();

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      data-active={isActive ? "true" : undefined}
      onMouseMove={mag.onMouseMove}
      onMouseLeave={mag.reset}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2",
        "rounded-xl px-3 py-2 text-sm outline-none",

        "transition-all duration-200 ease-out",

        // hover lift
        "hover:bg-white/10 dark:hover:bg-white/5",

        // active gradient pill (LEVEL 3 CORE)
        isActive &&
          "text-white shadow-md",
        isActive &&
          "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",

        // glow border
        isActive &&
          "ring-1 ring-white/20",

        // disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",

        className
      )}
      {...props}
    >
      {/* magnetic layer */}
      <div ref={mag.ref} className="flex items-center gap-2 w-full transition-transform duration-200">
        {props.children}
      </div>
    </DropdownMenuPrimitive.Item>
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* =========================================================
   CHECKBOX ITEM (clean glass)
========================================================= */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-xl",
      "py-2 pl-9 pr-3 text-sm",
      "transition-all",
      "hover:bg-white/10 dark:hover:bg-white/5",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center rounded-md border border-white/20 bg-white/5">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-white" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

/* =========================================================
   RADIO ITEM
========================================================= */
const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-xl",
      "py-2 pl-9 pr-3 text-sm",
      "hover:bg-white/10 dark:hover:bg-white/5",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center rounded-full border border-white/20">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-white text-white" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName =
  DropdownMenuPrimitive.RadioItem.displayName;

/* =========================================================
   LABEL (minimal pro)
========================================================= */
const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/50",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/* =========================================================
   SEPARATOR
========================================================= */
const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("my-1 h-px bg-white/10", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName =
  DropdownMenuPrimitive.Separator.displayName;

/* =========================================================
   SUB MENU
========================================================= */
const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[12rem] rounded-2xl border",
      "bg-white/10 dark:bg-black/30 backdrop-blur-2xl",
      "p-1 shadow-xl",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

/* =========================================================
   SUB TRIGGER
========================================================= */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm",
      "hover:bg-white/10 transition-all",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

/* =========================================================
   EXPORTS
========================================================= */
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  ActiveItemContext,
};