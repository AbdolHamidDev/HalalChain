import { AuthGuard } from "@/components/auth/auth-guard";
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
        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}