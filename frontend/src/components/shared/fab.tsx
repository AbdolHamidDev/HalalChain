"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptics";

interface FABProps {
  /** Accessible label */
  label?: string;
  /** Click handler */
  onClick: () => void;
  /** Custom icon (default: Plus) */
  icon?: ReactNode;
  /** Optional: hide on scroll down, show on scroll up */
  autoHide?: boolean;
  /** Extra classes */
  className?: string;
}

/**
 * Floating Action Button – mobile-first.
 * Appears above the bottom tab bar, auto-hides on scroll down.
 */
export function FAB({
  label = "Add",
  onClick,
  icon,
  autoHide = true,
  className,
}: FABProps) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!autoHide) return;

    function handleScroll() {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      // Hide when scrolling down past 50px, show when scrolling up
      if (delta > 10 && currentY > 80) {
        setVisible(false);
      } else if (delta < -10) {
        setVisible(true);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [autoHide]);

  function handleClick() {
    hapticImpact();
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        // Positioning
        "fixed bottom-20 right-4 z-30", // above bottom tab bar (pb-16)
        "lg:hidden", // desktop: hidden (use sidebar button instead)

        // Size & shape
        "flex h-14 w-14 items-center justify-center rounded-2xl",
        "bg-primary text-primary-foreground shadow-lg",
        "shadow-primary-hover",

        // Interaction
        "active:scale-95 transition-all duration-200 ease-out",
        "hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

        // Visibility
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",

        className
      )}
    >
      {icon ?? <Plus className="h-6 w-6" />}
    </button>
  );
}