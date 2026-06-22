"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, type NotificationPreferences } from "@/lib/api";
import { useTranslation } from "@/i18n/hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shimmer } from "@/components/shared/shimmer";

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

function PreferenceSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <Shimmer className="h-4 w-36" />
              <Shimmer className="h-3 w-56" />
            </div>
            <Shimmer className="h-5 w-5 rounded-full shrink-0" />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Shimmer className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationPreferencesForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState<FormState>(DEFAULT_PREFS);
  const [formState, setFormState] = useState<FormState>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const PREFERENCE_ROWS: { key: keyof FormState; labelKey: string; descriptionKey: string }[] = [
    { key: "certificateAlerts", labelKey: "settings.notifications.certificateAlerts", descriptionKey: "settings.notifications.certificateAlertsDesc" },
    { key: "inventoryAlerts", labelKey: "settings.notifications.inventoryAlerts", descriptionKey: "settings.notifications.inventoryAlertsDesc" },
    { key: "shipmentAlerts", labelKey: "settings.notifications.shipmentAlerts", descriptionKey: "settings.notifications.shipmentAlertsDesc" },
    { key: "invitationEmails", labelKey: "settings.notifications.invitationEmails", descriptionKey: "settings.notifications.invitationEmailsDesc" },
  ];

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

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  function handleToggle(key: keyof FormState, checked: boolean) {
    setFormState((prev) => ({ ...prev, [key]: checked }));
    setSaveError(null);
  }

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
      toast.success(t("settings.notifications.saved"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("settings.notifications.saveFailed");
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  const isSaveDisabled = JSON.stringify(formState) === JSON.stringify(savedPrefs) || saving;

  if (loading) {
    return <PreferenceSkeleton />;
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
            <p className="text-sm text-destructive font-medium">{t("settings.errors.loadFailed")}</p>
            <Button variant="outline" onClick={loadPreferences}>{t("common.retry")}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.notifications.title")}</CardTitle>
        <CardDescription>{t("settings.notifications.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {PREFERENCE_ROWS.map(({ key, labelKey, descriptionKey }) => (
            <div key={key} className="flex items-start gap-4">
              <div className="pt-0.5">
                <Checkbox
                  id={`pref-${key}`}
                  checked={formState[key]}
                  onCheckedChange={(checked) => handleToggle(key, checked === true)}
                  disabled={saving}
                   aria-label={t(labelKey)}
                 />
               </div>
               <label htmlFor={`pref-${key}`} className="flex flex-col gap-0.5 cursor-pointer select-none">
                 <span className="text-sm font-medium leading-none">{t(labelKey)}</span>
                 <span className="text-xs text-muted-foreground">{t(descriptionKey)}</span>
              </label>
            </div>
          ))}

          {saveError && <p className="text-sm text-destructive" role="alert">{saveError}</p>}

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={handleSave} disabled={isSaveDisabled} aria-busy={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t("common.saving")}</>
              ) : (
                t("common.save")
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}