"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  X,
  Globe,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNavGroupsForRole, type NavItem } from "@/lib/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMobileNav } from "@/components/layout/mobile-nav-provider";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { useTranslation } from "@/i18n/hooks";
import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Helpers ────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "MANAGER":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400";
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    default:
      return "Staff";
  }
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

// ── Single nav link ───────────────────────────────────────────────
function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center rounded-lg py-[7px] text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center px-0 w-full" : "gap-2.5 px-2.5",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <WiggleIcon className={cn(collapsed ? "shrink-0" : "")}>
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active
              ? "text-sidebar-primary"
              : "text-sidebar-foreground/40 group-hover:text-sidebar-accent-foreground"
          )}
        />
      </WiggleIcon>

      {!collapsed && (
        <>
          <span className="truncate">{t(item.translationKey)}</span>
          {active && (
            <ChevronRight className="ml-auto h-3 w-3 shrink-0 opacity-40" />
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {t(item.translationKey)}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

// ── Shared sidebar content ────────────────────────────────────────
interface SidebarPanelProps {
  onNavigate?: () => void;
  showClose?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  className?: string;
}

function SidebarPanel({
  onNavigate,
  showClose = false,
  onClose,
  collapsed = false,
  className,
}: SidebarPanelProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, isDemo } = useAuth();
  const groups = user ? getNavGroupsForRole(user.role) : [];
  const [commitCount, setCommitCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCommitCount() {
      try {
        const res = await fetch(
          "https://api.github.com/repos/AbdolHamidDev/HalalChain/commits?per_page=1"
        );
        const linkHeader = res.headers.get("Link");
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
          if (match) {
            setCommitCount(parseInt(match[1], 10));
          }
        }
      } catch {
        // silently ignore
      }
    }
    fetchCommitCount();
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground",
          "transition-[width] duration-300 ease-in-out overflow-hidden",
          collapsed ? "w-[60px]" : "w-[260px]",
          className
        )}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex h-[60px] items-center",
            collapsed ? "justify-center px-0" : "justify-between px-4"
          )}
        >
          {/* Logo + title */}
          <div
            className={cn(
              "flex items-center gap-3 min-w-0 overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
            )}
          >
            <Image src="/icon1.png" alt="HalalChain" width={36} height={36} className="shrink-0 rounded-lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-[15px] font-bold text-foreground leading-tight tracking-tight">
                  {t("sidebar.brand")}
                </h2>
                <a
                  href="https://github.com/AbdolHamidDev/HalalChain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="GitHub Commits"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  {commitCount !== null ? commitCount.toLocaleString() : ""}
                </a>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">{t("sidebar.platform")}</p>
            </div>
          </div>

          {/* Logo only when collapsed */}
          {collapsed && (
            <Image src="/logo.png" alt="HalalChain" width={26} height={26} className="rounded-md" />
          )}

          {/* Close (mobile) */}
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

        {/* ── Navigation ─────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-1">
          {/* Website link */}
          {(() => {
            const active = pathname === "/";
            const linkContent = (
              <Link
                href="/"
                onClick={onNavigate}
                className={cn(
                  "group flex items-center rounded-lg py-[7px] text-[13px] font-medium transition-all duration-150",
                  collapsed ? "justify-center px-0 w-full" : "gap-2.5 px-2.5",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <WiggleIcon>
                  <Globe
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      active
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-accent-foreground"
                    )}
                  />
                </WiggleIcon>

                {!collapsed && (
                  <>
                    <span className="truncate">{t("navigation.website")}</span>
                    {active && (
                      <ChevronRight className="ml-auto h-3 w-3 shrink-0 opacity-40" />
                    )}
                  </>
                )}
              </Link>
            );

            return (
              <ul className="mb-1">
                <li>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {t("navigation.website")}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              </ul>
            );
          })()}

          {/* ── Grouped navigation ──────────────────────────────── */}
          {groups.map((group) => (
            <div key={group.groupLabel} className="pt-2">
              {!collapsed && (
                <p className="text-overline mb-1.5 px-2.5 text-sidebar-foreground/40 select-none">
                  {t(group.groupLabel)}
                </p>
              )}
              {collapsed && (
                <div className="mx-auto mb-1.5 h-px w-4 bg-sidebar-border" />
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <li key={item.href}>
                      <NavLink
                        item={item}
                        active={active}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── User footer ────────────────────────────────────────── */}
        {user && (
          <div className={cn(collapsed ? "px-1.5 py-2" : "px-2.5 py-2.5")}>
            {collapsed ? (
              /* Collapsed: just avatar with tooltip */
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center justify-center"
                  >
                    <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-sidebar-border transition-all hover:ring-sidebar-primary/30">
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="text-[11px] font-semibold bg-sidebar-accent text-sidebar-accent-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-muted-foreground">{getRoleLabel(user.role)}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              /* Expanded: full user card */
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sidebar-accent/60 transition-colors group">
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border group-hover:ring-sidebar-primary/20 transition-all">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="text-[11px] font-semibold bg-sidebar-accent text-sidebar-accent-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-[13px] font-medium text-sidebar-accent-foreground leading-tight">
                      {user.name}
                    </p>
                    {user.isVerified && (
                      <Image
                        src="/verified.png"
                        alt="verified"
                        width={12}
                        height={12}
                        className="h-3 w-3 flex-shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none",
                        getRoleBadgeColor(user.role)
                      )}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                    {isDemo && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-200 dark:text-amber-300">
                        <Shield className="h-2.5 w-2.5" />
                        Demo
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="shrink-0 p-1 rounded-md text-sidebar-foreground/30 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent transition-all opacity-0 group-hover:opacity-100"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

// ── Main export ───────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useMobileNav();
  const { collapsed } = useSidebar();

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
      <div className="hidden h-screen shrink-0 lg:block">
        <SidebarPanel collapsed={collapsed} />
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