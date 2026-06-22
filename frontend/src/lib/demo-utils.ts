/**
 * Simple demo mode utilities
 */

/**
 * Check if current session is demo mode
 */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("halalchain_demo_admin") === "true";
}

/**
 * Show demo mode alert using dialog
 * Call this before any CRUD operation in demo mode
 */
export function showDemoAlert(): boolean {
  if (isDemoMode()) {
    // Set flag to show dialog on next render
    if (typeof window !== "undefined") {
      sessionStorage.setItem("show_demo_alert", "true");
    }
    return true;
  }
  return false;
}
