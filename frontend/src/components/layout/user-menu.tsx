"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "@/i18n/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Settings, KeyRound, LogOut } from "lucide-react";

export function UserMenu() {
  const { t } = useTranslation();
  const auth = useAuth();
  const router = useRouter();

  const user = auth.user;
  if (!user) return null;

  const handleSignOut = async () => {
    await auth.logout();
    router.push("/login");
  };

  const roleKey: "userMenu.roles.admin" | "userMenu.roles.manager" | "userMenu.roles.staff" =
    user.role === "ADMIN" ? "userMenu.roles.admin"
    : user.role === "MANAGER" ? "userMenu.roles.manager"
    : "userMenu.roles.staff";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t("userMenu.myProfile")}
        >
          <Avatar className="h-8 w-8 cursor-pointer">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            {user?.isVerified && (
              <img
                src="/verified.png"
                alt="verified"
                className="h-3.5 w-3.5 flex-shrink-0"
              />
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
          <Badge
            variant={
              user.role === "ADMIN"
                ? "success"
                : user.role === "MANAGER"
                ? "info"
                : "default"
            }
            className="mt-1"
          >
            {t(roleKey)}
          </Badge>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex cursor-pointer items-center gap-2">
            <User className="h-4 w-4" />
            <span>{t("userMenu.myProfile")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>{t("userMenu.accountSettings")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings/security" className="flex cursor-pointer items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>{t("userMenu.changePassword")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
          onSelect={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>{t("userMenu.signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}