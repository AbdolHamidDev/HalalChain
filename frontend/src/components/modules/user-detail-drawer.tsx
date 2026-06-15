"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Trash2,
  KeyRound,
  ShieldCheck,
  ShieldOff,
  UserCog,
  Check,
  X,
  Eye,
  EyeOff,
  Ban,
  CircleCheck,
} from "lucide-react";
import { api, type User, type UserRole, type UserStatus } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import {
  Sheet,
  SheetRoot,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { dialog } from "@/lib/dialog";

// ---------------------------------------------------------------------------
// Constants / helpers
// ---------------------------------------------------------------------------

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserDetailDrawerProps {
  user: User | null;
  currentUserId: string;
  open: boolean;
  onClose: () => void;
  onUserUpdated: (updated: User) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserDetailDrawer({
  user,
  currentUserId,
  open,
  onClose,
  onUserUpdated,
}: UserDetailDrawerProps) {
  const isSelf = user?.id === currentUserId;

  // ---- Edit name ----
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);

  // ---- Role change ----
  const [role, setRole] = useState<UserRole>("STAFF");
  const [savingRole, setSavingRole] = useState(false);

  // ---- Reset password ----
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState("");
  const [resettingPw, setResettingPw] = useState(false);

  // ---- Avatar ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ---- Verify toggle ----
  const [verifying, setVerifying] = useState(false);

  // ---- Suspend toggle ----
  const [suspending, setSuspending] = useState(false);

  // Sync controlled fields when drawer opens with a user
  const lastUserId = useRef<string | null>(null);
  if (user && user.id !== lastUserId.current) {
    lastUserId.current = user.id;
    setName(user.name);
    setRole(user.role);
    setNewPassword("");
    setPwError("");
    setNameError("");
    setAvatarError("");
    setAvatarPreview(null);
    setPendingFile(null);
  }

  if (!user) return null;

  // Narrowed reference for use inside async callbacks (TS can't narrow `user`
  // after async boundaries since it's a prop that could change)
  const safeUser = user;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSaveName() {
    if (!name.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }
    if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setNameError("");
    setSavingName(true);
    try {
      const { user: updated } = await api.adminUpdateUser(safeUser.id, { name: name.trim() });
      onUserUpdated(updated);
      toast.success("Name updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update name.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveRole() {
    if (isSelf) return;
    const ok = await dialog.confirm({
      type: "confirm",
      title: "Change role?",
      description: `Set ${safeUser.name}'s role to ${roleLabels[role]}?`,
      confirmLabel: "Change",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    setSavingRole(true);
    try {
      const { user: updated } = await api.adminChangeRole(safeUser.id, role);
      onUserUpdated(updated);
      toast.success("Role updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleResetPassword() {
    if (!newPassword) {
      setPwError("Password cannot be empty.");
      return;
    }
    setPwError("");
    const ok = await dialog.confirm({
      type: "destructive",
      title: "Reset password?",
      description: `This will immediately change ${safeUser.name}'s password. They will need to log in again.`,
      confirmLabel: "Reset",
      cancelLabel: "Cancel",
    });
    if (!ok) return;

    setResettingPw(true);
    try {
      await api.adminResetPassword(safeUser.id, { newPassword });
      setNewPassword("");
      toast.success("Password reset successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      setPwError(msg);
    } finally {
      setResettingPw(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarError("");
    if (file.size > MAX_FILE_SIZE) {
      setAvatarError("File must be under 5 MB.");
      return;
    }
    if (!ACCEPTED_MIME.includes(file.type)) {
      setAvatarError("Accepted: JPEG, PNG, GIF, WebP.");
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
    setPendingFile(file);
  }

  async function handleUploadAvatar() {
    if (!pendingFile) return;
    setUploadingAvatar(true);
    try {
      const { user: updated } = await api.adminUploadAvatar(safeUser.id, pendingFile);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setPendingFile(null);
      onUserUpdated(updated);
      toast.success("Avatar updated.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handleCancelAvatarPreview() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setPendingFile(null);
    setAvatarError("");
  }

  async function handleVerifyToggle() {
    const nextValue = !safeUser.isVerified;
    const ok = await dialog.confirm({
      type: nextValue ? "confirm" : "destructive",
      title: nextValue ? "Verify user?" : "Remove verification?",
      description: nextValue
        ? `Mark ${safeUser.name} as a verified user.`
        : `Remove the verified badge from ${safeUser.name}.`,
      confirmLabel: nextValue ? "Verify" : "Remove",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setVerifying(true);
    try {
      const { user: updated } = await api.adminVerifyUser(safeUser.id, nextValue);
      onUserUpdated(updated);
      toast.success(nextValue ? `${updated.name} verified.` : `Verification removed.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update verification.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSuspendToggle() {
    const isSuspended = safeUser.status === "SUSPENDED";
    const nextStatus: UserStatus = isSuspended ? "ACTIVE" : "SUSPENDED";
    const ok = await dialog.confirm({
      type: isSuspended ? "confirm" : "destructive",
      title: isSuspended ? "Reactivate account?" : "Suspend account?",
      description: isSuspended
        ? `${safeUser.name} will be able to log in again.`
        : `${safeUser.name} will immediately lose access and cannot log in.`,
      confirmLabel: isSuspended ? "Reactivate" : "Suspend",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setSuspending(true);
    try {
      const { user: updated } = await api.adminSetStatus(safeUser.id, nextStatus);
      onUserUpdated(updated);
      toast.success(isSuspended ? `${updated.name} reactivated.` : `${updated.name} suspended.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update account status.");
    } finally {
      setSuspending(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const currentAvatar = avatarPreview ?? user.avatarUrl ?? null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="User Details"
      description={`Manage account settings for ${user.name}`}
    >
      {/* ── Avatar section ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16">
            {currentAvatar && <AvatarImage src={currentAvatar} alt={user.name} />}
            <AvatarFallback className="text-base font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <Badge variant={roleBadgeVariant(user.role)}>{roleLabels[user.role]}</Badge>
            {user.isVerified && (
              <div className="flex items-center gap-1">
                <img src="/verified.png" alt="Verified" className="h-4 w-4" />
                <span className="text-xs text-emerald-600 font-medium">Verified</span>
              </div>
            )}
            {isSelf && (
              <span className="text-xs text-muted-foreground">(you)</span>
            )}
          </div>
        </div>

        {/* Avatar upload controls */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="sr-only"
            onChange={handleFileChange}
          />
          {pendingFile ? (
            <div className="flex gap-1.5">
              <Button size="sm" onClick={handleUploadAvatar} disabled={uploadingAvatar} className="gap-1">
                <Check className="h-3.5 w-3.5" />Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelAvatarPreview} disabled={uploadingAvatar} className="gap-1">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Photo
            </Button>
          )}
          {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
        </div>
      </div>

      <Separator className="my-2" />

      {/* ── Edit Name ──────────────────────────────────────────── */}
      <Section icon={<UserCog className="h-4 w-4" />} title="Display Name">
        <InputWrapper error={!!nameError}>
          <InputLabel htmlFor="admin-edit-name">Full name</InputLabel>
          <Input
            id="admin-edit-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(""); }}
            placeholder="Enter full name"
            error={!!nameError}
          />
          {nameError && <InputError>{nameError}</InputError>}
        </InputWrapper>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSaveName}
            disabled={savingName || name.trim() === user.name}
            className="gap-1.5"
          >
            {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Save Name
          </Button>
        </div>
      </Section>

      <Separator className="my-2" />

      {/* ── Role ───────────────────────────────────────────────── */}
      <Section icon={<ShieldCheck className="h-4 w-4" />} title="Role">
        {isSelf ? (
          <p className="text-sm text-muted-foreground">You cannot change your own role.</p>
        ) : (
          <>
            <div>
              <InputLabel htmlFor="admin-role-select">Role</InputLabel>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="admin-role-select" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{roleLabels.ADMIN}</SelectItem>
                  <SelectItem value="MANAGER">{roleLabels.MANAGER}</SelectItem>
                  <SelectItem value="STAFF">{roleLabels.STAFF}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveRole}
                disabled={savingRole || role === user.role}
                className="gap-1.5"
              >
                {savingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save Role
              </Button>
            </div>
          </>
        )}
      </Section>

      <Separator className="my-2" />

      {/* ── Verification ───────────────────────────────────────── */}
      <Section
        icon={user.isVerified ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldOff className="h-4 w-4" />}
        title="Verification Status"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">
              {user.isVerified ? (
                <span className="font-medium text-emerald-600">Verified user</span>
              ) : (
                <span className="text-muted-foreground">Not verified</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {`Verified badge is shown in the user's sidebar.`}
            </p>
          </div>
          {!isSelf && (
            <Button
              size="sm"
              variant={user.isVerified ? "outline" : "default"}
              onClick={handleVerifyToggle}
              disabled={verifying}
              className="gap-1.5 shrink-0"
            >
              {verifying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : user.isVerified ? (
                <><ShieldOff className="h-3.5 w-3.5" />Unverify</>
              ) : (
                <><ShieldCheck className="h-3.5 w-3.5" />Verify</>
              )}
            </Button>
          )}
        </div>
      </Section>

      <Separator className="my-2" />

      {/* ── Reset Password ─────────────────────────────────────── */}
      <Section icon={<KeyRound className="h-4 w-4" />} title="Reset Password">
        <p className="text-xs text-muted-foreground">
          Set a new password for this user. They will need to use it on their next login.
        </p>
        <InputWrapper error={!!pwError}>
          <InputLabel htmlFor="admin-reset-pw">New password</InputLabel>
          <Input
            id="admin-reset-pw"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setPwError(""); }}
            placeholder="Min. 8 characters"
            error={!!pwError}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          {pwError && <InputError>{pwError}</InputError>}
        </InputWrapper>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleResetPassword}
            disabled={resettingPw || !newPassword}
            className="gap-1.5"
          >
            {resettingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            Reset Password
          </Button>
        </div>
      </Section>

      <Separator className="my-2" />

      {/* ── Suspend / Activate ─────────────────────────────────── */}
      {!isSelf && (
        <>
          <Section
            icon={<Ban className="h-4 w-4 text-destructive" />}
            title="Account Status"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">
                  {user.status === "SUSPENDED" ? (
                    <span className="font-medium text-destructive">Account suspended</span>
                  ) : (
                    <span className="font-medium text-emerald-600">Account active</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {user.status === "SUSPENDED"
                    ? "User cannot log in while suspended."
                    : "User can log in and access the system."}
                </p>
                {user.lastLoginAt && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Last login:{" "}
                    {new Date(user.lastLoginAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant={user.status === "SUSPENDED" ? "default" : "destructive"}
                onClick={handleSuspendToggle}
                disabled={suspending}
                className="gap-1.5 shrink-0"
              >
                {suspending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : user.status === "SUSPENDED" ? (
                  <><CircleCheck className="h-3.5 w-3.5" />Reactivate</>
                ) : (
                  <><Ban className="h-3.5 w-3.5" />Suspend</>
                )}
              </Button>
            </div>
          </Section>
          <Separator className="my-2" />
        </>
      )}

      {/* ── Meta ───────────────────────────────────────────────── */}
      <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>User ID</span>
          <span className="font-mono truncate max-w-[180px]">{user.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Joined</span>
          <span>{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Section helper
// ---------------------------------------------------------------------------

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
