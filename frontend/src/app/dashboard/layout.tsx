import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { MobileNavProvider } from "@/components/layout/mobile-nav-provider";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <MobileNavProvider>
        <div className="flex min-h-screen bg-background lg:h-screen lg:overflow-hidden">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 lg:overflow-y-auto">
              <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </MobileNavProvider>
    </AuthGuard>
  );
}
