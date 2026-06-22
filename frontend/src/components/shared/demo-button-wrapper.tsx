"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { showDemoAlert } from "@/lib/demo-utils";

/**
 * Higher-order function to wrap onClick handlers with demo mode check
 * Usage: onClick={withDemoCheck(() => handleClick())}
 */
export function withDemoCheck<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    if (showDemoAlert()) {
      return; // Stop execution in demo mode
    }
    fn(...args);
  };
}

/**
 * Hook to check if in demo mode and get wrapper function
 */
export function useDemoMode() {
  const { isDemo } = useAuth();

  return {
    isDemo,
    withDemoCheck,
  };
}