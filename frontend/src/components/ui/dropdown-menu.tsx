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

/* -----------------------------
   CONTEXT: active highlight (LEVEL 2 FEATURE)
----------------------------- */
const ActiveItemContext = React.createContext<string | null>(null);

/* -----------------------------
   CONTENT (GLASS + DEPTH)
----------------------------- */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[14rem] overflow-hidden rounded-2xl border",
        "bg-popover/80 backdrop-blur-xl",
        "p-1 text-popover-foreground",
        "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]",

        // animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=top]:slide-in-from-bottom-2",

        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName =
  DropdownMenuPrimitive.Content.displayName;

/* -----------------------------
   ITEM (LEVEL 2: PILLED ACTIVE + SPRING FEEL)
----------------------------- */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    value?: string;
  }
>(({ className, inset, value, ...props }, ref) => {
  const active = React.useContext(ActiveItemContext);

  const isActive = value && active === value;

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      data-active={isActive ? "true" : undefined}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2",
        "rounded-xl px-3 py-2 text-sm outline-none",

        // base motion
        "transition-all duration-200 ease-out",

        // hover = spring lift
        "hover:bg-accent/60 hover:translate-x-[2px] hover:scale-[1.01]",

        // focus
        "focus:bg-accent focus:text-accent-foreground",

        // active pill highlight (LEVEL 2 KEY FEATURE)
        isActive &&
          "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20",

        // disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",

        "[&_svg]:size-4 [&_svg]:shrink-0",

        inset && "pl-9",
        className
      )}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* -----------------------------
   CHECKBOX ITEM (clean + modern tick box)
----------------------------- */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center",
      "rounded-xl py-2 pl-9 pr-3 text-sm",
      "transition-all duration-200",

      "hover:bg-accent/60",
      "focus:bg-accent",

      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center rounded-md border border-muted-foreground/30 bg-background/40">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-primary" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

/* -----------------------------
   RADIO ITEM (soft dot system)
----------------------------- */
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center",
      "rounded-xl py-2 pl-9 pr-3 text-sm",
      "transition-all duration-200",

      "hover:bg-accent/60",
      "focus:bg-accent",

      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/30">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-primary text-primary" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>

    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName =
  DropdownMenuPrimitive.RadioItem.displayName;

/* -----------------------------
   LABEL (clean hierarchy)
----------------------------- */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 text-[11px] font-medium uppercase tracking-wider",
      "text-muted-foreground",
      inset && "pl-9",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/* -----------------------------
   SEPARATOR (ultra subtle)
----------------------------- */
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("my-1 h-px bg-border/40", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName =
  DropdownMenuPrimitive.Separator.displayName;

/* -----------------------------
   SUB MENU (same glass system)
----------------------------- */
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[12rem] overflow-hidden rounded-2xl border",
      "bg-popover/80 backdrop-blur-xl p-1",
      "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]",

      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

/* -----------------------------
   SUB TRIGGER
----------------------------- */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center rounded-xl px-3 py-2 text-sm",
      "transition-all hover:bg-accent/60",
      "focus:bg-accent",
      inset && "pl-9",
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

/* -----------------------------
   SHORTCUT
----------------------------- */
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs opacity-60 tracking-wider", className)}
    {...props}
  />
);

DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

/* -----------------------------
   EXPORT
----------------------------- */
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  ActiveItemContext, // 👈 LEVEL 2 FEATURE EXPORT
};