"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTranslation } from "@/i18n/hooks";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export function SecuritySection() {
  const { t } = useTranslation();

  const schema = z
    .object({
      currentPassword: z.string().min(1, t("settings.security.currentPassword") + " is required"),
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

  const onSubmit = async (values: SecurityFormValues) => {
    try {
      await api.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      toast.success(t("settings.security.updateSuccess"));
      reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";

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
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.security.title")}</CardTitle>
        <CardDescription>{t("settings.security.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <InputWrapper error={!!errors.currentPassword}>
            <InputLabel htmlFor="currentPassword">{t("settings.security.currentPassword")}</InputLabel>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <InputError>{errors.currentPassword.message}</InputError>
            )}
          </InputWrapper>

          <InputWrapper error={!!errors.newPassword}>
            <InputLabel htmlFor="newPassword">{t("settings.security.newPassword")}</InputLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <InputError>{errors.newPassword.message}</InputError>
            )}
          </InputWrapper>

          <InputWrapper error={!!errors.confirmPassword}>
            <InputLabel htmlFor="confirmPassword">{t("settings.security.confirmPassword")}</InputLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <InputError>{errors.confirmPassword.message}</InputError>
            )}
          </InputWrapper>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("settings.security.updateSuccess")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}