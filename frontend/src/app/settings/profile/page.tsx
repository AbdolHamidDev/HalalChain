"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { api, type User, type UserRole } from "@/lib/api";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import { dialog } from "@/lib/dialog";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Skeleton helpers (Requirements 3.1, 13.1)
// ---------------------------------------------------------------------------

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your profile information</p>
      </div>

      {/* Avatar skeleton */}
      <div className="flex items-center gap-4">
        <SkeletonLine className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <SkeletonLine className="h-9 w-28" />
          <SkeletonLine className="h-9 w-24" />
        </div>
      </div>

      {/* Form card skeleton */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-[38px] w-full" />
        </div>
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-16" />
          <SkeletonLine className="h-5 w-48" />
        </div>
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-12" />
          <SkeletonLine className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-5 w-32" />
        </div>
        <SkeletonLine className="h-[38px] w-32" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Role → Badge variant map (Requirement 3.4)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const auth = useAuth();
  const router = useRouter();

  // Profile state (Requirements 3.1, 3.2)
  const [loading, setLoading] = useState(true);
  const [error, setProfileError] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  // Cached "last saved" name — used to detect unsaved changes and disable save button
  // (Requirements 4.2)
  const [savedName, setSavedName] = useState("");

  // Local avatar URL so changes from AvatarUpload propagate without re-fetch
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Unsaved-changes guard state (Requirement 4.8)
  const pendingNavigationRef = useRef<(() => void) | null>(null);

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

  // ---------------------------------------------------------------------------
  // Load profile on mount (Requirements 3.1, 3.6)
  // ---------------------------------------------------------------------------

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

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ---------------------------------------------------------------------------
  // beforeunload guard — fires when user tries to close tab / browser navigate
  // (Requirements 4.8, 13.1)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ---------------------------------------------------------------------------
  // In-app navigation guard — intercept router.push when form is dirty
  // (Requirement 4.8)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isDirty) return;

    const originalPush = router.push.bind(router);

    (router as typeof router & { _guardedPush?: typeof router.push })._guardedPush = async (
      href: string,
      options?: Parameters<typeof router.push>[1]
    ) => {
      const ok = await dialog.confirm({
        title: "Unsaved changes",
        description:
          "You have unsaved changes. If you leave this page, your changes will be lost.",
        type: "destructive",
        confirmLabel: "Leave",
        cancelLabel: "Stay",
      });
      if (ok) originalPush(href, options);
    };

    return () => {
      delete (router as typeof router & { _guardedPush?: typeof router.push })._guardedPush;
    };
  }, [isDirty, router]);

  // ---------------------------------------------------------------------------
  // Submit handler (Requirements 4.3, 4.4, 4.5, 13.2, 13.4, 13.5, 13.8)
  // ---------------------------------------------------------------------------

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const { user: updated } = await api.updateProfile({ name: values.name.trim() });
      setProfile(updated);
      setSavedName(updated.name);
      reset({ name: updated.name });
      await auth.refresh();
      toast.success("Profile updated successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";

      // Map name-related 400 errors to inline field error (Requirement 13.4)
      if (
        message.toLowerCase().includes("name") ||
        message.toLowerCase().includes("character") ||
        message.toLowerCase().includes("required") ||
        message.toLowerCase().includes("empty") ||
        message.toLowerCase().includes("whitespace") ||
        message.toLowerCase().includes("1 and 100")
      ) {
        setError("name", { message });
      } else {
        // 5xx or network errors → toast (Requirements 13.5, 13.8)
        toast.error(message || "Failed to update profile. Please try again.");
      }
    }
  };

  // Save button is disabled when: submitting, name unchanged, or no profile loaded
  // (Requirement 4.2)
  const isSaveDisabled = isSubmitting || currentName === savedName || !profile;

  // ---------------------------------------------------------------------------
  // Render — Loading skeleton (Requirements 3.1, 13.1)
  // ---------------------------------------------------------------------------

  if (loading) {
    return <ProfileSkeleton />;
  }

  // ---------------------------------------------------------------------------
  // Render — Error state (Requirement 3.6)
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your profile information</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
          <p className="text-sm text-destructive font-medium">
            Could not load your profile. Please check your connection and try again.
          </p>
          <Button variant="outline" onClick={loadProfile}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — Main (Requirements 3.2, 3.3, 3.4, 3.5, 4.1)
  // ---------------------------------------------------------------------------

  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile information</p>
      </div>

      {/* Avatar section (Requirements 5.1–5.10) */}
      {profile && (
        <AvatarUpload
          name={profile.name}
          avatarUrl={avatarUrl}
          onAvatarChange={(url) => setAvatarUrl(url)}
        />
      )}

      {/* Profile form (Requirements 4.1, 4.2, 13.2) */}
      {profile && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="rounded-lg border p-6 space-y-4"
        >
          {/* Display name — editable (Requirements 4.1, 13.4) */}
          <InputWrapper>
            <InputLabel htmlFor="name">Display Name</InputLabel>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              error={!!errors.name}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <InputError>{errors.name.message}</InputError>
            )}
          </InputWrapper>

          {/* Email — read-only (Requirement 3.3) */}
          <div className="space-y-2">
            <InputLabel>Email</InputLabel>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>

          {/* Role — read-only Badge (Requirement 3.4) */}
          <div className="space-y-2">
            <InputLabel>Role</InputLabel>
            <div>
              <Badge variant={roleBadgeVariant(profile.role)}>
                {profile.role}
              </Badge>
            </div>
          </div>

          {/* Member since — read-only (Requirement 3.5) */}
          <div className="space-y-2">
            <InputLabel>Member Since</InputLabel>
            <p className="text-sm text-muted-foreground">{memberSince}</p>
          </div>

          {/* Save button (Requirements 4.2, 13.2) */}
          <Button type="submit" disabled={isSaveDisabled}>
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      )}
    </div>
  );
}
