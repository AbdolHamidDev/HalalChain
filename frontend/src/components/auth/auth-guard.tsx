"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { motion, AnimatePresence } from "framer-motion";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen />}
      </AnimatePresence>

      {!loading && user && children}
    </>
  );
}

/* =========================
   LOADING UI (SaaS STYLE)
========================= */
function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.96, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-[360px] rounded-2xl bg-background p-6 shadow-xl"
      >
        {/* Header skeleton */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-2 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Body skeleton */}
        <div className="space-y-3">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-muted" />
        </div>

        {/* Spinner */}
        <div className="mt-6 flex justify-center">
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full border border-muted" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
          </div>
        </div>

        {/* Text */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Verifying session...
        </p>
      </motion.div>
    </motion.div>
  );
}