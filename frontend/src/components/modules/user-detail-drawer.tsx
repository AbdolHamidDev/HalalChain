"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
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
import { Sheet } from "@/components/ui/sheet";
import Image from "next/image";
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
import { useTranslation } from "@/i18n/hooks";

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function roleBadgeVariant(role: UserRole): BadgeProps["variant"] {
  switch (role) {
    case "ADMIN": return "info";
    case "MANAGER": return "warning";
    default: return "outline";
  }
}

interface UserDetailDrawerProps {
  user: User | null;
  currentUserId: string;
  open: boolean;
  onClose: () => void;
  onUserUpdated: (updated: User) => void;
}

export function UserDetailDrawer({ user, currentUserId, open, onClose, onUserUpdated }: UserDetailDrawerProps) {
  const { t } = useTranslation();
  const isSelf = user?.id === currentUserId;

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [role, setRole] = useState<UserRole>("STAFF");
  const [savingRole, setSavingRole] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState("");
  const [resettingPw, setResettingPw] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [suspending, setSuspending] = useState(false);

  const lastUserId = useRef<string | null>(null);
  if (user && user.id !== lastUserId.current) {
    lastUserId.current = user.id;
    setName(user.name);
    setRole(user.role);
    setNewPassword(""); setPwError(""); setNameError(""); setAvatarError(""); setAvatarPreview(null); setPendingFile(null);
  }

  if (!user) return null;
  const safeUser = user;

  const roleLabels: Record<UserRole, string> = {
    ADMIN: t("userMenu.roles.admin"),
    MANAGER: t("userMenu.roles.manager"),
    STAFF: t("userMenu.roles.staff"),
  };

  async function handleSaveName() {
    if (!name.trim()) { setNameError(t("users.nameEmpty")); return; }
    if (name.trim().length < 2) { setNameError(t("users.nameMinLength")); return; }
    setNameError(""); setSavingName(true);
    try { const { user: updated } = await api.adminUpdateUser(safeUser.id, { name: name.trim() }); onUserUpdated(updated); toast.success(t("users.nameUpdated")); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t("users.nameUpdateFailed")); }
    finally { setSavingName(false); }
  }

  async function handleSaveRole() {
    if (isSelf) return;
    const ok = await dialog.confirm({ type: "confirm", title: t("users.changeRole"), description: t("users.changeRoleDesc", { values: { name: safeUser.name, role: roleLabels[role] } }), confirmLabel: t("users.change"), cancelLabel: t("users.cancel") });
    if (!ok) return;
    setSavingRole(true);
    try { const { user: updated } = await api.adminChangeRole(safeUser.id, role); onUserUpdated(updated); toast.success(t("users.roleUpdated")); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t("users.roleUpdateFailed")); }
    finally { setSavingRole(false); }
  }

  async function handleResetPassword() {
    if (!newPassword) { setPwError(t("users.nameEmpty")); return; }
    setPwError("");
    const ok = await dialog.confirm({ type: "destructive", title: t("users.resetPasswordConfirm"), description: t("users.resetPasswordConfirmDesc", { values: { name: safeUser.name } }), confirmLabel: t("users.reset"), cancelLabel: t("users.cancel") });
    if (!ok) return;
    setResettingPw(true);
    try { await api.adminResetPassword(safeUser.id, { newPassword }); setNewPassword(""); toast.success(t("users.passwordReset")); }
    catch (err: unknown) { const msg = err instanceof Error ? err.message : t("users.passwordResetFailed"); setPwError(msg); }
    finally { setResettingPw(false); }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    setAvatarError("");
    if (file.size > MAX_FILE_SIZE) { setAvatarError("File must be under 5 MB."); return; }
    if (!ACCEPTED_MIME.includes(file.type)) { setAvatarError("Accepted: JPEG, PNG, GIF, WebP."); return; }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file)); setPendingFile(file);
  }

  async function handleUploadAvatar() {
    if (!pendingFile) return; setUploadingAvatar(true);
    try { const { user: updated } = await api.adminUploadAvatar(safeUser.id, pendingFile); if (avatarPreview) URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); setPendingFile(null); onUserUpdated(updated); toast.success(t("settings.profile.saved")); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t("settings.profile.saveFailed")); }
    finally { setUploadingAvatar(false); }
  }

  function handleCancelAvatarPreview() { if (avatarPreview) URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); setPendingFile(null); setAvatarError(""); }

  async function handleVerifyToggle() {
    const nextValue = !safeUser.isVerified;
    const ok = await dialog.confirm({ type: nextValue ? "confirm" : "destructive", title: nextValue ? t("users.verifyUser") : t("users.removeVerification"), description: nextValue ? t("users.verifyDesc", { values: { name: safeUser.name } }) : t("users.unverifyDesc", { values: { name: safeUser.name } }), confirmLabel: nextValue ? t("users.verify") : t("users.unverify"), cancelLabel: t("users.cancel") });
    if (!ok) return; setVerifying(true);
    try { const { user: updated } = await api.adminVerifyUser(safeUser.id, nextValue); onUserUpdated(updated); toast.success(t("users.verificationUpdated")); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t("users.verificationUpdateFailed")); }
    finally { setVerifying(false); }
  }

  async function handleSuspendToggle() {
    const isSuspended = safeUser.status === "SUSPENDED"; const nextStatus: UserStatus = isSuspended ? "ACTIVE" : "SUSPENDED";
    const ok = await dialog.confirm({ type: isSuspended ? "confirm" : "destructive", title: isSuspended ? t("users.reactivateConfirm") : t("users.suspendConfirm"), description: isSuspended ? t("users.reactivateDesc", { values: { name: safeUser.name } }) : t("users.suspendDesc", { values: { name: safeUser.name } }), confirmLabel: isSuspended ? t("users.reactivate") : t("users.suspend"), cancelLabel: t("users.cancel") });
    if (!ok) return; setSuspending(true);
    try { const { user: updated } = await api.adminSetStatus(safeUser.id, nextStatus); onUserUpdated(updated); toast.success(t("users.accountUpdated")); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t("users.accountUpdateFailed")); }
    finally { setSuspending(false); }
  }

  const currentAvatar = avatarPreview ?? user.avatarUrl ?? null;

  return (
    <Sheet open={open} onClose={onClose} title={t("users.userDetails")} description={t("users.userDetails") + " — " + user.name}>
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16">{currentAvatar && <AvatarImage src={currentAvatar} alt={user.name} />}<AvatarFallback className="text-base font-semibold">{getInitials(user.name)}</AvatarFallback></Avatar>
          {uploadingAvatar && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50"><Loader2 className="h-5 w-5 animate-spin text-white" /></div>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <Badge variant={roleBadgeVariant(user.role)}>{roleLabels[user.role]}</Badge>
            {user.isVerified && <div className="flex items-center gap-1"><Image src="/verified.png" alt="Verified" width={16} height={16} className="h-4 w-4" /><span className="text-xs text-emerald-600 font-medium">{t("users.verifiedUser")}</span></div>}
            {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" onChange={handleFileChange} />
          {pendingFile ? (
            <div className="flex gap-1.5">
              <Button size="sm" onClick={handleUploadAvatar} disabled={uploadingAvatar} className="gap-1"><Check className="h-3.5 w-3.5" />{t("common.save")}</Button>
              <Button size="sm" variant="outline" onClick={handleCancelAvatarPreview} disabled={uploadingAvatar} className="gap-1"><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="gap-1.5"><Upload className="h-3.5 w-3.5" />{t("settings.profile.avatarLabel")}</Button>
          )}
          {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
        </div>
      </div>

      <Separator className="my-2" />

      <Section icon={<UserCog className="h-4 w-4" />} title={t("users.displayName")}>
        <InputWrapper error={!!nameError}><InputLabel htmlFor="admin-edit-name">{t("settings.profile.nameLabel")}</InputLabel><Input id="admin-edit-name" value={name} onChange={(e) => { setName(e.target.value); setNameError(""); }} placeholder={t("settings.profile.nameLabel")} error={!!nameError} />{nameError && <InputError>{nameError}</InputError>}</InputWrapper>
        <div className="flex justify-end"><Button size="sm" onClick={handleSaveName} disabled={savingName || name.trim() === user.name} className="gap-1.5">{savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{t("users.saveName")}</Button></div>
      </Section>

      <Separator className="my-2" />

      <Section icon={<ShieldCheck className="h-4 w-4" />} title={t("users.role")}>
        {isSelf ? <p className="text-sm text-muted-foreground">{t("common.no")}</p> : (
          <><div><InputLabel htmlFor="admin-role-select">{t("users.role")}</InputLabel><Select value={role} onValueChange={(v) => setRole(v as UserRole)}><SelectTrigger id="admin-role-select" className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">{roleLabels.ADMIN}</SelectItem><SelectItem value="MANAGER">{roleLabels.MANAGER}</SelectItem><SelectItem value="STAFF">{roleLabels.STAFF}</SelectItem></SelectContent></Select></div><div className="flex justify-end"><Button size="sm" onClick={handleSaveRole} disabled={savingRole || role === user.role} className="gap-1.5">{savingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{t("users.saveRole")}</Button></div></>
        )}
      </Section>

      <Separator className="my-2" />

      <Section icon={user.isVerified ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <ShieldOff className="h-4 w-4" />} title={t("users.verificationStatus")}>
        <div className="flex items-center justify-between">
          <div><p className="text-sm">{user.isVerified ? <span className="font-medium text-emerald-600">{t("users.verifiedUser")}</span> : <span className="text-muted-foreground">{t("users.notVerified")}</span>}</p><p className="mt-0.5 text-xs text-muted-foreground">{t("users.verifiedDesc")}</p></div>
          {!isSelf && <Button size="sm" variant={user.isVerified ? "outline" : "default"} onClick={handleVerifyToggle} disabled={verifying} className="gap-1.5 shrink-0">{verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user.isVerified ? <><ShieldOff className="h-3.5 w-3.5" />{t("users.unverify")}</> : <><ShieldCheck className="h-3.5 w-3.5" />{t("users.verify")}</>}</Button>}
        </div>
      </Section>

      <Separator className="my-2" />

<Section icon={<KeyRound className="h-4 w-4" />} title={t("users.resetPassword")}>
        <p className="text-xs text-muted-foreground">{t("users.resetPasswordDesc")}</p>
        <InputWrapper error={!!pwError}><InputLabel htmlFor="admin-reset-pw">{t("auth.newPassword")}</InputLabel><Input id="admin-reset-pw" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwError(""); }} placeholder={t("auth.errors.passwordMinLength")} error={!!pwError} rightIcon={<button type="button" onClick={() => setShowPassword((v) => !v)} className="text-muted-foreground hover:text-foreground" aria-label={showPassword ? t("common.hide") : t("common.show")}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />{pwError && <InputError>{pwError}</InputError>}</InputWrapper>
        <div className="flex justify-end"><Button size="sm" variant="destructive" onClick={handleResetPassword} disabled={resettingPw || !newPassword} className="gap-1.5">{resettingPw ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}{t("users.resetPassword")}</Button></div>
      </Section>

      <Separator className="my-2" />

      {!isSelf && (<>
        <Section icon={<Ban className="h-4 w-4 text-destructive" />} title={t("users.accountStatus")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">{user.status === "SUSPENDED" ? <span className="font-medium text-destructive">{t("users.accountSuspended")}</span> : <span className="font-medium text-emerald-600">{t("users.accountActive")}</span>}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{user.status === "SUSPENDED" ? t("users.suspendedDesc") : t("users.activeDesc")}</p>
              {user.lastLoginAt && <p className="mt-0.5 text-xs text-muted-foreground">{t("users.joined")}: {new Date(user.lastLoginAt).toLocaleDateString()}</p>}
            </div>
            <Button size="sm" variant={user.status === "SUSPENDED" ? "default" : "destructive"} onClick={handleSuspendToggle} disabled={suspending} className="gap-1.5 shrink-0">{suspending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : user.status === "SUSPENDED" ? <><CircleCheck className="h-3.5 w-3.5" />{t("users.reactivate")}</> : <><Ban className="h-3.5 w-3.5" />{t("users.suspend")}</>}</Button>
          </div>
        </Section>
        <Separator className="my-2" />
      </>)}

      <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between"><span>{t("users.userId")}</span><span className="font-mono truncate max-w-[180px]">{user.id}</span></div>
        <div className="flex justify-between"><span>{t("users.joined")}</span><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
      </div>
    </Sheet>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (<div className="space-y-3"><div className="flex items-center gap-2"><span className="text-muted-foreground">{icon}</span><h3 className="text-sm font-semibold">{title}</h3></div>{children}</div>);
}