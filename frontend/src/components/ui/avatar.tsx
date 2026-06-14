import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    status?: "online" | "offline" | "away" | "busy";
    ring?: boolean;
  }
>(({ className, status, ring = false, ...props }, ref) => (
  <div className="relative inline-flex">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full",
        "bg-muted/40",
        ring &&
          "ring-2 ring-background ring-offset-2 ring-offset-muted/40",
        className
      )}
      {...props}
    />

    {/* Status dot */}
    {status && (
      <span
        className={cn(
          "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
          status === "online" && "bg-emerald-500",
          status === "offline" && "bg-zinc-400",
          status === "away" && "bg-yellow-400",
          status === "busy" && "bg-red-500"
        )}
      />
    )}
  </div>
));

Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      onLoadingStatusChange={(status) => {
        if (status === "loaded") setLoaded(true);
      }}
      className={cn(
        "h-full w-full object-cover transition-all duration-300",
        loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
      {...props}
    />
  );
});

AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full",
        "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
        "text-white text-xs font-semibold select-none",
        className
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  );
});

AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };