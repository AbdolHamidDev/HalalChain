import { AuthGuard } from "@/components/auth/auth-guard";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SettingsHeader } from "@/components/settings/settings-header";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <SettingsHeader />
        <div className="flex flex-1 min-h-0">
          <SettingsSidebar />
          <main className="flex-1 min-w-0 p-6 md:p-8">
            <div className="mx-auto max-w-2xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
