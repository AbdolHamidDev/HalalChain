"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, type NotificationPreferences } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormState = {
  certificateAlerts: boolean;
  inventoryAlerts: boolean;
  shipmentAlerts: boolean;
  invitationEmails: boolean;
};

const DEFAULT_PREFS: FormState = {
  certificateAlerts: true,
  inventoryAlerts: true,
  shipmentAlerts: true,
  invitationEmails: true,
};

// ---------------------------------------------------------------------------
// Skeleton helpers — 4 Switch-shaped placeholder rows (Requirement 10.8)
// ---------------------------------------------------------------------------

function PreferenceSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-56 animate-pulse rounded bg-muted" />
          </div>
          {/* Switch-shaped skeleton */}
          <div className="h-5 w-5 animate-pulse rounded-full bg-muted shrink-0" />
        </div>
      ))}
      <div className="h-9 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preference toggle rows definition
// ---------------------------------------------------------------------------

const PREFERENCE_ROWS: {
  key: keyof FormState;
  label: string;
  description: string;
}[] = [
  {
    key: "certificateAlerts",
    label: "Certificate Alerts",
    description: "Get notified when a halal certificate is expiring or has expired.",
  },
  {
    key: "inventoryAlerts",
    label: "Inventory Alerts",
    description: "Get notified when inventory stock falls below the reorder level.",
  },
  {
    key: "shipmentAlerts",
    label: "Shipment Alerts",
    description: "Get notified when a shipment is delayed or its status changes.",
  },
  {
    key: "invitationEmails",
    label: "Invitation Emails",
    description: "Receive email invitations when you are invited to join an organisation.",
  },
];

// ---------------------------------------------------------------------------
// Deep equality helper
// ---------------------------------------------------------------------------

function deepEqual(a: FormState, b: FormState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------------------------------------------------------------------------
// NotificationPreferencesForm
// ---------------------------------------------------------------------------

/**
 * Loads the user's notification preferences, renders four toggle controls,
 * and saves changes via PATCH /api/settings/notifications.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */
export function NotificationPreferencesForm() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  /** True while the initial GET is in-flight (Requirement 10.8) */
  const [loading, setLoading] = useState(true);

  /** True when the load failed */
  const [loadError, setLoadError] = useState(false);

  /** The last-saved preferences returned from the server */
  const [savedPrefs, setSavedPrefs] = useState<FormState>(DEFAULT_PREFS);

  /** Local form state (Requirement 10.2) */
  const [formState, setFormState] = useState<FormState>(DEFAULT_PREFS);

  /** True while the PATCH mutation is in-flight (Requirement 10.6) */
  const [saving, setSaving] = useState(false);

  /**
   * Inline error message shown below the form on save failure.
   * Toggles are NOT reset on failure (Requirement 10.7).
   */
  const [saveError, setSaveError] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load preferences on mount (Requirement 10.1)
  // -------------------------------------------------------------------------

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { preferences } = await api.getNotificationPreferences();
      const loaded: FormState = {
        certificateAlerts: preferences.certificateAlerts,
        inventoryAlerts: preferences.inventoryAlerts,
        shipmentAlerts: preferences.shipmentAlerts,
        invitationEmails: preferences.invitationEmails,
      };
      setSavedPrefs(loaded);
      setFormState(loaded);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // -------------------------------------------------------------------------
  // Toggle handler (Requirement 10.3)
  // -------------------------------------------------------------------------

  function handleToggle(key: keyof FormState, checked: boolean) {
    setFormState((prev) => ({ ...prev, [key]: checked }));
    // Clear save error when user changes a toggle (Requirement 10.7)
    setSaveError(null);
  }

  // -------------------------------------------------------------------------
  // Save handler (Requirements 10.4, 10.5, 10.6, 10.7)
  // -------------------------------------------------------------------------

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const { preferences } = await api.updateNotificationPreferences(formState);
      const updated: FormState = {
        certificateAlerts: preferences.certificateAlerts,
        inventoryAlerts: preferences.inventoryAlerts,
        shipmentAlerts: preferences.shipmentAlerts,
        invitationEmails: preferences.invitationEmails,
      };
      setSavedPrefs(updated);
      setFormState(updated);
      // Success toast (Requirement 10.5)
      toast.success("Notification preferences saved.");
    } catch (err: unknown) {
      // Show error inline WITHOUT resetting toggles (Requirement 10.7)
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save preferences. Please try again.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  /**
   * Save is disabled when:
   * - form equals last-saved state (no changes) (Requirement 10.4)
   * - mutation is in-flight (Requirement 10.6)
   */
  const isSaveDisabled = deepEqual(formState, savedPrefs) || saving;

  // -------------------------------------------------------------------------
  // Render — Loading skeleton (Requirement 10.8)
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            Choose which email notifications you want to receive.
          </p>
        </div>
        <PreferenceSkeleton />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — Load error state
  // -------------------------------------------------------------------------

  if (loadError) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            Choose which email notifications you want to receive.
          </p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
          <p className="text-sm text-destructive font-medium">
            Could not load your notification preferences. Please check your connection and try again.
          </p>
          <Button variant="outline" onClick={loadPreferences}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render — Main form (Requirements 10.1–10.7)
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-1 text-muted-foreground">
          Choose which email notifications you want to receive.
        </p>
      </div>

      {/* Preferences card */}
      <div className="rounded-lg border p-6 space-y-6">
        {/* Four toggle rows (Requirements 10.1, 10.2, 10.3) */}
        {PREFERENCE_ROWS.map(({ key, label, description }) => (
          <div key={key} className="flex items-start gap-4">
            {/* Checkbox aligned to first line of label */}
            <div className="pt-0.5">
              <Checkbox
                id={`pref-${key}`}
                checked={formState[key]}
                onCheckedChange={(checked) =>
                  handleToggle(key, checked === true)
                }
                disabled={saving}
                aria-label={label}
              />
            </div>
            {/* Label + description */}
            <label
              htmlFor={`pref-${key}`}
              className="flex flex-col gap-0.5 cursor-pointer select-none"
            >
              <span className="text-sm font-medium leading-none">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </label>
          </div>
        ))}

        {/* Inline save error (Requirement 10.7) */}
        {saveError && (
          <p className="text-sm text-destructive" role="alert">
            {saveError}
          </p>
        )}

        {/* Save button (Requirements 10.4, 10.6) */}
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          aria-busy={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
