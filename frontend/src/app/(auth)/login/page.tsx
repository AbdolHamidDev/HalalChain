"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const { loginDemo } = useAuth();

  const handleDemoLogin = async () => {
    try {
      await loginDemo("demo-admin@halalchain.local", "demo-admin-2024");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Demo login failed:", err);
    }
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="space-y-6 text-center">
        <div className="flex justify-center">
          <Image
            src="/icon1.png"
            alt="HalalChain"
            width={64}
            height={64}
            priority
            className="h-16 w-16 object-contain"
          />
        </div>

        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            HalalChain
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <LoginForm />
        <Button
          variant="outline"
          className="w-full"
          onClick={handleDemoLogin}
        >
          <Shield className="mr-2 h-4 w-4" />
          Try Demo Admin
        </Button>
        <div className="text-center">
          <Link
            href="/demo-admin"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Or use demo admin page with pre-filled credentials
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}