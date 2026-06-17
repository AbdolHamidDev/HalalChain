"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { api, type UserRole } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import { useTranslation } from "@/i18n/hooks";
import { Shimmer } from "@/components/shared/shimmer";

function AcceptInviteForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("STAFF");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(t("acceptInvite.errors.invalidToken"));
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
        setTokenError(t("acceptInvite.errors.invalidToken"));
        setValidating(false);
      });
  }, [token, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;

    if (!name.trim() || name.trim().length < 2) {
      setNameError(t("auth.errors.nameRequired"));
      valid = false;
    } else {
      setNameError("");
    }

    if (!password) {
      setPasswordError(t("auth.errors.passwordRequired"));
      valid = false;
    } else if (password.length < 8) {
      setPasswordError(t("auth.errors.passwordMinLength"));
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
      const msg = err instanceof Error ? err.message : t("auth.errors.signUpFailed");
      setPasswordError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const roleLabel: Record<UserRole, string> = {
    ADMIN: t("userMenu.roles.admin"),
    MANAGER: t("userMenu.roles.manager"),
    STAFF: t("userMenu.roles.staff"),
  };

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Shimmer className="h-6 w-6 rounded-full" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center space-y-3">
          <p className="text-2xl">🔒</p>
          <h1 className="text-lg font-semibold">{t("errors.notFound")}</h1>
          <p className="text-sm text-muted-foreground">{tokenError}</p>
          <Button variant="outline" className="w-full mt-2" onClick={() => router.push("/login")}>
            {t("auth.signIn")}
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h1 className="text-lg font-semibold">{t("acceptInvite.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("acceptInvite.description")}</p>
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
          <h1 className="text-xl font-semibold">{t("acceptInvite.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("acceptInvite.description")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("common.role")}: {roleLabel[inviteRole]}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-card p-6"
        >
          <InputWrapper error={!!nameError}>
            <InputLabel htmlFor="accept-name">{t("auth.name")}</InputLabel>
            <Input
              id="accept-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              placeholder={t("auth.name")}
              error={!!nameError}
              autoFocus
            />
            {nameError && <InputError>{nameError}</InputError>}
          </InputWrapper>

          <InputWrapper error={!!passwordError}>
            <InputLabel htmlFor="accept-password">{t("auth.password")}</InputLabel>
            <Input
              id="accept-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              placeholder={t("auth.errors.passwordMinLength")}
              error={!!passwordError}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? t("common.hide") : t("common.show")}
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
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              t("acceptInvite.submit")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Shimmer className="h-6 w-6 rounded-full" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
