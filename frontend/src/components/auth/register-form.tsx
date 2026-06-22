"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper, InputLabel, InputError } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { useTranslation } from "@/i18n/hooks";

const schema = z
  .object({
    name: z.string().min(2, "auth.errors.nameRequired"),
    email: z.string().email("auth.errors.emailInvalid"),
    password: z.string().min(8, "auth.errors.passwordMinLength"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.errors.passwordMismatch",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.errors.signUpFailed"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <InputWrapper error={!!errors.name}>
        <InputLabel htmlFor="name">{t("auth.name")}</InputLabel>
        <Input
          id="name"
          autoComplete="name"
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <InputError id="name-error" role="alert">{t(errors.name.message!)}</InputError>
        )}
      </InputWrapper>

      <InputWrapper error={!!errors.email}>
        <InputLabel htmlFor="email">{t("auth.email")}</InputLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <InputError id="email-error" role="alert">{t(errors.email.message!)}</InputError>
        )}
      </InputWrapper>

      <InputWrapper error={!!errors.password}>
        <InputLabel htmlFor="password">{t("auth.password")}</InputLabel>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-describedby={errors.password ? "password-error" : undefined}
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <InputError id="password-error" role="alert">{t(errors.password.message!)}</InputError>
        )}
      </InputWrapper>

      <InputWrapper error={!!errors.confirmPassword}>
        <InputLabel htmlFor="confirmPassword">{t("auth.confirmPassword")}</InputLabel>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <InputError id="confirm-password-error" role="alert">{t(errors.confirmPassword.message!)}</InputError>
        )}
      </InputWrapper>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("auth.signingIn") : t("auth.createAccount")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}