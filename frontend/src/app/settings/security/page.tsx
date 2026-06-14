"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SecurityFormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// SecurityPage
// ---------------------------------------------------------------------------

export default function SecurityPage() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SecurityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const onSubmit = async (values: SecurityFormValues) => {
    try {
      await api.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      toast.success("Password changed successfully.");
      reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";

      // Determine whether the error maps to a specific field or is a generic toast
      const lower = message.toLowerCase();

      if (lower.includes("current password")) {
        setError("currentPassword", { message });
      } else if (lower.includes("passwords do not match") || lower.includes("do not match")) {
        setError("confirmPassword", { message });
      } else if (
        lower.includes("complexity") ||
        lower.includes("uppercase") ||
        lower.includes("lowercase") ||
        lower.includes("digit") ||
        lower.includes("length") ||
        lower.includes("at least") ||
        lower.includes("must contain") ||
        lower.includes("must be at least") ||
        lower.includes("must not exceed")
      ) {
        setError("newPassword", { message });
      } else if (
        // 5xx / network-level errors — message is generic or the raw HTTP error text
        lower.includes("server") ||
        lower.includes("network") ||
        lower.includes("failed") ||
        lower.includes("something went wrong") ||
        lower.includes("internal") ||
        // fallback: if we can't map to a field, show a toast
        true
      ) {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="mt-1 text-muted-foreground">Change your password</p>
      </div>

      {/* Password change form */}
      <div className="rounded-lg border p-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Current Password */}
          <InputWrapper>
            <InputLabel htmlFor="currentPassword">Current Password</InputLabel>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              error={!!errors.currentPassword}
              aria-invalid={!!errors.currentPassword}
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <InputError>{errors.currentPassword.message}</InputError>
            )}
          </InputWrapper>

          {/* New Password */}
          <InputWrapper>
            <InputLabel htmlFor="newPassword">New Password</InputLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              error={!!errors.newPassword}
              aria-invalid={!!errors.newPassword}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <InputError>{errors.newPassword.message}</InputError>
            )}
          </InputWrapper>

          {/* Confirm New Password */}
          <InputWrapper>
            <InputLabel htmlFor="confirmPassword">Confirm New Password</InputLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <InputError>{errors.confirmPassword.message}</InputError>
            )}
          </InputWrapper>

          {/* Submit */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Change Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
