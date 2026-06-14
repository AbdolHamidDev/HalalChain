"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { api, type UserRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Inner component — uses useSearchParams, must be inside Suspense
// ---------------------------------------------------------------------------

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  // Validate token
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("STAFF");

  // Form
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No invitation token provided.");
      setValidating(false);
      return;
    }

    api
      .validateInviteToken(token)
      .then(({ email, role }) => {
        setInviteEmail(email);
        setInviteRole(role);
        setValidating(false);
      })
      .catch(() => {
        setTokenError("This invitation link is invalid or has expired.");
        setValidating(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;

    if (!name.trim() || name.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      valid = false;
    } else {
      setNameError("");
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (!valid) return;

    setSubmitting(true);
    try {
      await api.acceptInvitation({ token, name: name.trim(), password });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account.";
      setPasswordError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel: Record<UserRole, string> = {
    ADMIN: "Administrator",
    MANAGER: "Operations Manager",
    STAFF: "Warehouse Staff",
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <p className="text-2xl">🔒</p>
          <h1 className="text-lg font-semibold">Invalid invitation</h1>
          <p className="text-sm text-muted-foreground">{tokenError}</p>
          <Button variant="outline" className="w-full mt-2" onClick={() => router.push("/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h1 className="text-lg font-semibold">Account created!</h1>
          <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="HalalChain" className="mx-auto h-10 w-auto mb-4" />
          <h1 className="text-xl font-semibold">You&apos;ve been invited</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your account for{" "}
            <span className="font-medium text-foreground">{inviteEmail}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Role: {roleLabel[inviteRole]}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6"
        >
          <InputWrapper error={!!nameError}>
            <InputLabel htmlFor="accept-name">Full name</InputLabel>
            <Input
              id="accept-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              placeholder="Your full name"
              error={!!nameError}
              autoFocus
            />
            {nameError && <InputError>{nameError}</InputError>}
          </InputWrapper>

          <InputWrapper error={!!passwordError}>
            <InputLabel htmlFor="accept-password">Password</InputLabel>
            <Input
              id="accept-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder="Min. 8 characters"
              error={!!passwordError}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
            {passwordError && <InputError>{passwordError}</InputError>}
          </InputWrapper>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page — wraps form in Suspense (required for useSearchParams in Next.js 13+)
// ---------------------------------------------------------------------------

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
