"use client";

import { Toaster, type ToasterProps } from "sonner";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * Toaster that shows at bottom-center on mobile, top-center on desktop.
 * Matches native mobile app behavior where toasts appear near the bottom.
 */
export function ResponsiveToaster(props: ToasterProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");

  return (
    <Toaster
      {...props}
      position={isMobile ? "bottom-center" : "top-center"}
      offset={isMobile ? 80 : 16}
      expand={false}
      gap={8}
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}