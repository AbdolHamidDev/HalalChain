"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function DemoAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo-admin@halalchain.local");
  const [password, setPassword] = useState("demo-admin-2024");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/demo-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Store demo flag in localStorage for frontend awareness
      if (data.isDemo) {
        localStorage.setItem("halalchain_demo_admin", "true");
        localStorage.setItem("halalchain_demo_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-md overflow-hidden ring-1 ring-border/50">
              <Image src="/icon1.png" alt="HalalChain" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-display text-base font-bold tracking-tight">
              HalalChain
            </span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Demo Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              <Shield className="size-3.5" />
              Demo Admin Access
            </span>
          </div>

          {/* Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold font-display tracking-tight">
                Demo Admin Login
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Access the admin panel without creating a real account. All changes are temporary and stored locally.
              </p>
            </div>

            {/* Warning */}
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950/30 dark:border-amber-800">
              <div className="flex gap-2">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="font-semibold mb-1">Demo Mode Notice</p>
                  <p>This is a temporary admin session. No data will be saved to the database. Changes are stored in your browser's local memory only.</p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Signing in..." : "Access Demo Admin"}
              </button>
            </form>

            {/* Demo Credentials Hint */}
            <div className="mt-6 rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Demo Credentials:</p>
              <p className="text-xs font-mono text-muted-foreground">
                Email: demo-admin@halalchain.local
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Password: demo-admin-2024
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Need a real account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}