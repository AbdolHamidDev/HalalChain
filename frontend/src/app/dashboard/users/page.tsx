"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, RefreshCw, Search } from "lucide-react";
import { api, type User, type UserRole } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dialog } from "@/lib/dialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Operations Manager",
  STAFF: "Warehouse Staff",
};

function roleBadgeVariant(role: UserRole): BadgeProps["variant"] {
  switch (role) {
    case "ADMIN":
      return "info";
    case "MANAGER":
      return "warning";
    case "STAFF":
    default:
      return "outline";
  }
}

function SkeletonRow() {
  return (
    <TableRow>
      {[...Array(5)].map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null); // userId being toggled

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users: data } = await api.adminListUsers();
      setUsers(data);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ---------------------------------------------------------------------------
  // Verify toggle
  // ---------------------------------------------------------------------------

  const handleVerifyClick = async (user: User) => {
    const nextValue = !user.isVerified;

    const ok = await dialog.confirm({
      type: nextValue ? "confirm" : "destructive",
      title: nextValue ? "Verify user?" : "Remove verification?",
      description: nextValue
        ? `This will mark ${user.name} as a verified user. They will see a verified badge in the sidebar.`
        : `This will remove the verified badge from ${user.name}.`,
      confirmLabel: nextValue ? "Verify" : "Remove",
      cancelLabel: "Cancel",
    });

    if (!ok) return;

    setVerifying(user.id);
    try {
      const { user: updated } = await api.adminVerifyUser(user.id, nextValue);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(
        nextValue
          ? `${updated.name} has been verified.`
          : `Verification removed from ${updated.name}.`
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update verification status."
      );
    } finally {
      setVerifying(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Filter
  // ---------------------------------------------------------------------------

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage accounts and verified status for all users.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, email or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {search ? "No users match your search." : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isUpdating = verifying === u.id;

                return (
                  <TableRow key={u.id}>
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {u.avatarUrl && (
                            <AvatarImage src={u.avatarUrl} alt={u.name} />
                          )}
                          <AvatarFallback className="text-[11px]">
                            {getInitials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-tight">
                            {u.name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge variant={roleBadgeVariant(u.role)}>
                        {roleLabels[u.role]}
                      </Badge>
                    </TableCell>

                    {/* Verified status */}
                    <TableCell>
                      {u.isVerified ? (
                        <div className="flex items-center gap-2">
                          <img
                            src="/verified.png"
                            alt="Verified"
                            className="h-5 w-5"
                          />
                          <span className="text-sm font-medium text-emerald-600">Verified</span>
                        </div>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={u.isVerified ? "outline" : "default"}
                        disabled={isUpdating || isSelf}
                        onClick={() => handleVerifyClick(u)}
                        className="gap-1.5"
                        title={isSelf ? "You cannot change your own verification status" : undefined}
                      >
                        {isUpdating ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : u.isVerified ? (
                          <>
                            <ShieldOff className="h-3.5 w-3.5" />
                            Unverify
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verify
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
