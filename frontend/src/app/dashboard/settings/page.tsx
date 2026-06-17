"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/hooks";
import { cn } from "@/lib/utils";
import { User, Shield, Bell, Palette } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { PreferencesSection } from "@/components/settings/preferences-section";

const TABS = [
  { key: "profile", icon: User },
  { key: "security", icon: Shield },
  { key: "notifications", icon: Bell },
  { key: "preferences", icon: Palette },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.pageDescription")}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1" aria-label="Settings tabs">
          {TABS.map(({ key, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(`settings.tabs.${key}` as any)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {activeTab === "profile" && <ProfileSection />}
        {activeTab === "security" && <SecuritySection />}
        {activeTab === "notifications" && <NotificationPreferencesForm />}
        {activeTab === "preferences" && <PreferencesSection />}
      </div>
    </div>
  );
}