"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, ChevronRight, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavItemsForRole } from "@/lib/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useMobileNav } from "@/components/layout/mobile-nav-provider";
import { useSidebar } from "@/components/layout/sidebar-provider";
import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  MANAGER: "Operations Manager",
  STAFF: "Warehouse Staff",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Wiggle icon wrapper ───────────────────────────────────────────
function WiggleIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  const [wiggling, setWiggling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    if (wiggling) return;
    setWiggling(true);
    timerRef.current = setTimeout(() => setWiggling(false), 450);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <span
      onMouseEnter={handleMouseEnter}
      className={cn("flex items-center justify-center", className)}
    >
      <span className={cn(wiggling && "animate-wiggle")}>{children}</span>
    </span>
  );
}

// ── Shared sidebar content ────────────────────────────────────────
interface SidebarPanelProps {
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

function SidebarPanel({
  onNavigate,
  showClose = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarPanelProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const items = user ? getNavItemsForRole(user.role) : [];

  return (
    <TooltipProvider delayDuration={0}>
     <aside
  className={cn(
    "relative flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
    "transition-[width] duration-300 ease-in-out overflow-hidden",
    collapsed ? "w-[60px]" : "w-64",
    className
  )}
>
        {/* Header */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-0" : "justify-between px-5"
          )}
        >
          
          {/* Logo + title */}
          <div
            className={cn(
              "flex items-center gap-3 min-w-0 overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
            )}
          >
            <Image src="/logo.png" alt="HalalChain" width={32} height={32} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-sm font-semibold text-foreground leading-tight">
                HalalChain
              </h2>
              <p className="text-[10px] text-muted-foreground">Traceability Platform</p>
            </div>
          </div>

          {/* Logo only when collapsed */}
          {collapsed && (
            <Image src="/logo.png" alt="HalalChain" width={28} height={28} />
          )}

          {/* Close (mobile) or collapse toggle (desktop) */}
          {showClose && onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 lg:hidden"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
       ) : null}
        </div>
{onToggleCollapse && (
  <button
    type="button"
    onClick={onToggleCollapse}
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    className="
      absolute
      top-16
      -right-3
      z-50
      flex
      h-6
      w-6
      items-center
      justify-center
      rounded-full
      border
      border-sidebar-border
      bg-background
      shadow-md
      transition-all
      hover:scale-105
    "
  >
    {collapsed ? (
      <PanelLeftOpen className="h-3.5 w-3.5" />
    ) : (
      <PanelLeftClose className="h-3.5 w-3.5" />
    )}
  </button>
)}
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
          {!collapsed && (
            <p className="text-overline mb-2 px-2 text-neutral">Navigation</p>
          )}
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              const linkContent = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center rounded-md py-2 text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center px-0 w-full" : "gap-3 px-3",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <WiggleIcon>
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                      )}
                    />
                  </WiggleIcon>

                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <ChevronRight className="ml-auto h-3 w-3 shrink-0 opacity-60" />
                      )}
                    </>
                  )}
                </Link>
              );

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

      </aside>
    </TooltipProvider>
  );
}

// ── Main export ───────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useMobileNav();
  const { collapsed, toggle: toggleCollapse } = useSidebar();

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
   <div className="relative hidden h-screen shrink-0 lg:block">
  <SidebarPanel
    collapsed={collapsed}
  />

  <button
    type="button"
    onClick={toggleCollapse}
    className="
      absolute
      top-20
      -right-3
      z-50
      flex
      h-7
      w-7
      items-center
      justify-center
      rounded-full
      border
      border-sidebar-border
      bg-background
      shadow-md
      hover:scale-105
      transition-all
    "
  >
    {collapsed ? (
      <PanelLeftOpen className="h-4 w-4" />
    ) : (
      <PanelLeftClose className="h-4 w-4" />
    )}
  </button>
</div>

      {/* Mobile overlay */}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarPanel
          showClose
          onClose={() => setOpen(false)}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </>
  );
}
