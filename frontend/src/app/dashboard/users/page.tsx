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
import { useTranslation } from "@/i18n/hooks";
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
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useDebounce } from "@/lib/useDebounce";
import { Shimmer } from "@/components/shared/shimmer";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function roleBadgeVariant(role: UserRole): BadgeProps["variant"] {
  switch (role) {
    case "ADMIN": return "info";
    case "MANAGER": return "warning";
    default: return "outline";
  }
}


function StatCard({ label, value, color }: { label: string; value: number; color?: "emerald" | "red" | "amber" }) {
  const colorMap = { emerald: "text-emerald-500", red: "text-red-500", amber: "text-amber-500" };
  return (
    <div className="rounded-xl bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color ? colorMap[color] : ""}`}>{value}</p>
    </div>
  );
}

const PAGE_LIMIT = 10;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    ADMIN: t("userMenu.roles.admin"),
    MANAGER: t("userMenu.roles.manager"),
    STAFF: t("userMenu.roles.staff"),
  };

  const loadUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.adminListUsers({ page: p, limit: PAGE_LIMIT, search: debouncedSearch || undefined, role: roleFilter !== "ALL" ? roleFilter : undefined, status: statusFilter !== "ALL" ? statusFilter : undefined });
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error(t("common.errors.generic"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, t]);

  const loadStats = useCallback(async () => {
    try {
      const { stats: data } = await api.adminGetUserStats();
      setStats(data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter, statusFilter]);
  useEffect(() => { loadUsers(page); }, [loadUsers, page]);

  function openDrawer(user: User) { setSelectedUser(user); setDrawerOpen(true); }
  function closeDrawer() { setDrawerOpen(false); }
  function handleUserUpdated(updated: User) { setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u))); setSelectedUser(updated); loadStats(); }

  return (
    <>
      <Breadcrumbs />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t("users.pageTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total > 0 ? `${total} ${t("users.totalUsers").toLowerCase()}` : t("users.pageDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={() => { loadUsers(page); loadStats(); }} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              {t("common.retry")}
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-2">
              <UserPlus className="h-3.5 w-3.5" />
              {t("users.inviteUser")}
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label={t("users.totalUsers")} value={stats.total} />
            <StatCard label={t("users.activeUsers")} value={stats.active} color="emerald" />
            <StatCard label={t("users.suspendedUsers")} value={stats.suspended} color="red" />
            <StatCard label={t("users.unverifiedUsers")} value={stats.unverified} color="amber" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full max-w-xs">
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              placeholder={t("users.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "ALL")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("users.allRoles")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("users.allRoles")}</SelectItem>
              <SelectItem value="ADMIN">{roleLabels.ADMIN}</SelectItem>
              <SelectItem value="MANAGER">{roleLabels.MANAGER}</SelectItem>
              <SelectItem value="STAFF">{roleLabels.STAFF}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t("users.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("users.allStatuses")}</SelectItem>
              <SelectItem value="ACTIVE">{t("users.statusActive")}</SelectItem>
              <SelectItem value="SUSPENDED">{t("users.statusSuspended")}</SelectItem>
            </SelectContent>
          </Select>

          {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setRoleFilter("ALL"); setStatusFilter("ALL"); }}>
              {t("common.clear")}
            </Button>
          )}
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.displayName")}</TableHead>
                <TableHead>{t("settings.profile.emailLabel")}</TableHead>
                <TableHead>{t("users.role")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("users.joined")}</TableHead>
                <TableHead className="text-right">{t("users.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}>
                        <Shimmer className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    {search || roleFilter !== "ALL" || statusFilter !== "ALL"
                      ? t("common.noResults")
                      : t("users.noUsers")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isSuspended = u.status === "SUSPENDED";
                  return (
                    <TableRow key={u.id} className={`cursor-pointer ${isSuspended ? "opacity-60" : ""}`} onClick={() => openDrawer(u)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                            <AvatarFallback className="text-[11px]">{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-medium leading-tight">{u.name}</p>
                              {u.isVerified && <img src="/verified.png" alt="Verified" className="h-3.5 w-3.5 shrink-0" />}
                              {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell><Badge variant={roleBadgeVariant(u.role)}>{roleLabels[u.role]}</Badge></TableCell>
                      <TableCell>
                        {isSuspended ? (
                          <Badge variant="danger">{t("users.statusSuspended")}</Badge>
                        ) : (
                          <Badge variant="success">{t("users.statusActive")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : <span className="text-xs italic">Never</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDrawer(u); }} className="gap-1.5">
                          <UserCog className="h-3.5 w-3.5" />
                          {t("users.manage")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("common.previous")} {page} / {totalPages} · {total} {t("users.totalUsers").toLowerCase()}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="gap-1">
                <ChevronLeft className="h-3.5 w-3.5" />
                {t("common.previous")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="gap-1">
                {t("common.next")}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <UserDetailDrawer user={selectedUser} currentUserId={currentUser?.id ?? ""} open={drawerOpen} onClose={closeDrawer} onUserUpdated={handleUserUpdated} />
      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}