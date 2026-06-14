"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { getInitials } from "@/lib/utils";
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

/**
 * UserMenu — renders the authenticated user's avatar (or initials fallback)
 * as a DropdownMenu trigger in the DashboardHeader.
 *
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */
export function UserMenu() {
  const auth = useAuth();
  const router = useRouter();

  const user = auth.user;

  // Nothing to render if user is not yet loaded
  if (!user) return null;

  const handleSignOut = async () => {
    await auth.logout();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      {/* Trigger: avatar image if available, else initials fallback */}
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8 cursor-pointer">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      {/* Dropdown content — closes automatically on item selection (Radix default) */}
      <DropdownMenuContent align="end" className="w-48">
        {/* User identity header */}
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
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
            {user.role}
          </Badge>
        </div>

        <DropdownMenuSeparator />

        {/* My Profile → /settings/profile */}
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex cursor-pointer items-center gap-2">
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>

        {/* Account Settings → /settings/profile */}
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>

        {/* Change Password → /settings/security */}
        <DropdownMenuItem asChild>
          <Link href="/settings/security" className="flex cursor-pointer items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>Change Password</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign Out — calls auth.logout() then redirects to /login */}
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
          onSelect={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
