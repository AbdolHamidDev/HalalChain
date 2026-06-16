"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { api, type User, type UserRole } from "@/lib/api";
import { useTranslation, type I18nContextValue } from "@/i18n/hooks";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

function ProfileSkeleton({ t }: { t: I18nContextValue["t"] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <SkeletonLine className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <SkeletonLine className="h-9 w-28" />
              <SkeletonLine className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2"><SkeletonLine className="h-4 w-24" /><SkeletonLine className="h-[38px] w-full" /></div>
          <div className="space-y-2"><SkeletonLine className="h-4 w-16" /><SkeletonLine className="h-5 w-48" /></div>
          <div className="space-y-2"><SkeletonLine className="h-4 w-12" /><SkeletonLine className="h-6 w-20 rounded-full" /></div>
          <SkeletonLine className="h-[38px] w-32" />
        </CardContent>
      </Card>
    </div>
  );
}

function roleBadgeVariant(role: UserRole): BadgeProps["variant"] {
  switch (role) {
    case "ADMIN": return "info";
    case "MANAGER": return "warning";
    case "STAFF":
    default: return "outline";
  }
}

export function ProfileSection() {
  const auth = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setProfileError] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [savedName, setSavedName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const profileSchema = z.object({
    name: z.string().min(1, t("auth.errors.nameRequired")).max(100, t("auth.errors.passwordMinLength")),
  });

  type ProfileFormValues = z.infer<typeof profileSchema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  const currentName = watch("name");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setProfileError(false);
    try {
      const { user } = await api.getProfile();
      setProfile(user);
      setSavedName(user.name);
      setAvatarUrl(user.avatarUrl ?? null);
      reset({ name: user.name });
    } catch {
      setProfileError(true);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const { user: updated } = await api.updateProfile({ name: values.name.trim() });
      setProfile(updated);
      setSavedName(updated.name);
      reset({ name: updated.name });
      await auth.refresh();
      toast.success(t("settings.profile.saved"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.errors.generic");
      if (message.toLowerCase().includes("name") || message.toLowerCase().includes("character") || message.toLowerCase().includes("required") || message.toLowerCase().includes("empty") || message.toLowerCase().includes("whitespace") || message.toLowerCase().includes("1 and 100")) {
        setError("name", { message });
      } else {
        toast.error(message || t("settings.profile.saveFailed"));
      }
    }
  };

  const isSaveDisabled = isSubmitting || currentName === savedName || !profile;

  if (loading) return <ProfileSkeleton t={t} />;

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
            <p className="text-sm text-destructive font-medium">{t("settings.errors.loadFailed")}</p>
            <Button variant="outline" onClick={loadProfile}>{t("common.retry")}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const roleLabels: Record<UserRole, string> = {
    ADMIN: t("userMenu.roles.admin"),
    MANAGER: t("userMenu.roles.manager"),
    STAFF: t("userMenu.roles.staff"),
  };

  const memberSince = profile ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "";

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile.title")}</CardTitle>
          <CardDescription>{t("settings.profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          {profile && (
            <AvatarUpload name={profile.name} avatarUrl={avatarUrl} onAvatarChange={(url) => setAvatarUrl(url)} />
          )}

          <div className="border-t border-border" />
          {profile && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <InputWrapper error={!!errors.name}>
                <InputLabel htmlFor="name">{t("settings.profile.nameLabel")}</InputLabel>
                <Input id="name" type="text" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
                {errors.name && <InputError>{errors.name.message}</InputError>}
              </InputWrapper>

              <div className="space-y-2">
                <InputLabel>{t("settings.profile.emailLabel")}</InputLabel>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <InputLabel>{t("settings.profile.roleLabel")}</InputLabel>
                  <div><Badge variant={roleBadgeVariant(profile.role)}>{roleLabels[profile.role]}</Badge></div>
                </div>

                <div className="space-y-2">
                  <InputLabel>{t("users.joined")}</InputLabel>
                  <p className="text-sm text-muted-foreground">{memberSince}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaveDisabled}>
                  {isSubmitting ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}