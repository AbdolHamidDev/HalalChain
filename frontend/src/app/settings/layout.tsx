import { AuthGuard } from "@/components/auth/auth-guard";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <SettingsSidebar />
        <main className="flex-1 min-w-0 p-6">
          <div className="mx-auto max-w-2xl">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
