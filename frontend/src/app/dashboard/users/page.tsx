"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  UserCog,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { api, type User, type UserRole, type UserStatus, type UserStats } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserDetailDrawer } from "@/components/modules/user-detail-drawer";
import { InviteUserDialog } from "@/components/modules/invite-user-dialog";
import { useDebounce } from "@/lib/useDebounce";

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
    default:
      return "outline";
  }
}

function SkeletonRow() {
  return (
    <TableRow>
      {[...Array(6)].map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "emerald" | "red" | "amber";
}) {
  const colorMap = {
    emerald: "text-emerald-500",
    red: "text-red-500",
    amber: "text-amber-500",
  };
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color ? colorMap[color] : ""}`}>
        {value}
      </p>
    </div>
  );
}

const PAGE_LIMIT = 10;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);

  // Stats
  const [stats, setStats] = useState<UserStats | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");

  const debouncedSearch = useDebounce(search, 300);

  // Drawer
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  const loadUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.adminListUsers({
        page: p,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter]);

  // Refresh stats whenever users change (after update/suspend/etc)
  const loadStats = useCallback(async () => {
    try {
      const { stats: data } = await api.adminGetUserStats();
      setStats(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers(page);
  }, [loadUsers, page]);

  // ---------------------------------------------------------------------------
  // Drawer
  // ---------------------------------------------------------------------------

  function openDrawer(user: User) {
    setSelectedUser(user);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function handleUserUpdated(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelectedUser(updated);
    // Refresh aggregate stats after any user change
    loadStats();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total > 0 ? `${total} user${total === 1 ? "" : "s"} total` : "Manage accounts, roles, and access."}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { loadUsers(page); loadStats(); }}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="gap-2"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Users"   value={stats.total}     />
            <StatCard label="Active"        value={stats.active}    color="emerald" />
            <StatCard label="Suspended"     value={stats.suspended} color="red" />
            <StatCard label="Unverified"    value={stats.unverified} color="amber" />
          </div>
        )}

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full max-w-xs">
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "ALL")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="ADMIN">Administrator</SelectItem>
              <SelectItem value="MANAGER">Operations Manager</SelectItem>
              <SelectItem value="STAFF">Warehouse Staff</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setRoleFilter("ALL"); setStatusFilter("ALL"); }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Table */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: PAGE_LIMIT }).map((_, i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {search || roleFilter !== "ALL" || statusFilter !== "ALL"
                      ? "No users match your filters."
                      : "No users found."}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isSuspended = u.status === "SUSPENDED";

                  return (
                    <TableRow
                      key={u.id}
                      className={`cursor-pointer ${isSuspended ? "opacity-60" : ""}`}
                      onClick={() => openDrawer(u)}
                    >
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
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-medium leading-tight">
                                {u.name}
                              </p>
                              {u.isVerified && (
                                <img src="/verified.png" alt="Verified" className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {isSelf && (
                                <span className="text-xs text-muted-foreground">(you)</span>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              Joined{" "}
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

                      {/* Status */}
                      <TableCell>
                        {isSuspended ? (
                          <Badge variant="danger">Suspended</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </TableCell>

                      {/* Last Login */}
                      <TableCell className="text-sm text-muted-foreground">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : <span className="text-xs italic">Never</span>}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(u);
                          }}
                          className="gap-1.5"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages} · {total} user{total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User detail drawer */}
      <UserDetailDrawer
        user={selectedUser}
        currentUserId={currentUser?.id ?? ""}
        open={drawerOpen}
        onClose={closeDrawer}
        onUserUpdated={handleUserUpdated}
      />

      {/* Invite user dialog */}
      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}
