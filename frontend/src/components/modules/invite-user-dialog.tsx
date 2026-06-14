"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Loader2, UserPlus, Trash2, Clock } from "lucide-react";
import { api, type Invitation, type UserRole } from "@/lib/api";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Operations Manager",
  STAFF: "Warehouse Staff",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InviteUserDialog({ open, onClose }: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("STAFF");
  const [emailError, setEmailError] = useState("");
  const [sending, setSending] = useState(false);

  // Pending invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Last generated invite link
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load pending invites when dialog opens
  const [initialized, setInitialized] = useState(false);
  if (open && !initialized) {
    setInitialized(true);
    loadInvitations();
  }
  if (!open && initialized) {
    setInitialized(false);
  }

  async function loadInvitations() {
    setLoadingInvites(true);
    try {
      const { invitations: data } = await api.adminListInvitations();
      setInvitations(data);
    } catch {
      // non-critical
    } finally {
      setLoadingInvites(false);
    }
  }

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) { setEmailError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailError("Enter a valid email address."); return; }
    setEmailError("");
    setSending(true);
    try {
      const { invitation } = await api.adminCreateInvitation({ email: trimmed, role });
      setLastInviteUrl(invitation.inviteUrl ?? null);
      setInvitations((prev) => [{ ...invitation, inviter: undefined }, ...prev]);
      setEmail("");
      toast.success(`Invitation created for ${trimmed}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invitation.";
      if (msg.toLowerCase().includes("already")) {
        setEmailError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      await api.adminRevokeInvitation(id);
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invitation revoked.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invitation.");
    } finally {
      setRevoking(null);
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setEmail("");
    setRole("STAFF");
    setEmailError("");
    setLastInviteUrl(null);
    onClose();
  }

  return (
    <DialogRoot open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invite link. The user sets their own password when they accept.
            Links expire after 48 hours.
          </DialogDescription>
        </DialogHeader>

        {/* ── Invite form ──────────────────────────────────────── */}
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <InputWrapper error={!!emailError}>
              <InputLabel htmlFor="invite-email">Email address</InputLabel>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="colleague@company.com"
                error={!!emailError}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              {emailError && <InputError>{emailError}</InputError>}
            </InputWrapper>

            <div>
              <InputLabel htmlFor="invite-role">Role</InputLabel>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="invite-role" className="mt-1.5 w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{roleLabels.ADMIN}</SelectItem>
                  <SelectItem value="MANAGER">{roleLabels.MANAGER}</SelectItem>
                  <SelectItem value="STAFF">{roleLabels.STAFF}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending} className="gap-1.5">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Send Invite
            </Button>
          </div>

          {/* ── Generated link ────────────────────────────────── */}
          {lastInviteUrl && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Invite link (copy and share)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs border border-border">
                  {lastInviteUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyLink(lastInviteUrl)}
                  className="shrink-0 gap-1"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Pending invitations ──────────────────────────────── */}
        {(invitations.length > 0 || loadingInvites) && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-sm font-semibold">Pending invitations</p>
              {loadingInvites ? (
                <div className="h-8 animate-pulse rounded bg-muted" />
              ) : (
                <ul className="space-y-2">
                  {invitations.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{inv.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] py-0">{roleLabels[inv.role]}</Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Expires {new Date(inv.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevoke(inv.id)}
                        disabled={revoking === inv.id}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label="Revoke invitation"
                      >
                        {revoking === inv.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
