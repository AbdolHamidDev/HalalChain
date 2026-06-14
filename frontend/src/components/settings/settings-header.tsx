"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function SettingsHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="hidden shrink-0 items-center gap-2 md:flex">
          <Image src="/logo.png" alt="HalalChain" width={28} height={28} />
          <span className="text-sm font-semibold text-foreground">HalalChain</span>
        </Link>

        <Separator orientation="vertical" className="hidden h-4 md:block" />

        {/* Settings icon + title */}
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>Settings</span>
        </div>

        {/* Right side */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Mobile back link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
