import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileNavProvider } from "@/components/layout/mobile-nav-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <MobileNavProvider>
        <SidebarProvider>
          <div className="flex min-h-screen bg-background lg:h-screen lg:overflow-hidden">
            <Sidebar />
            <DashboardShell>
              <DashboardHeader />
              <main className="flex-1 lg:overflow-y-auto">
                <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
                  {children}
                </div>
              </main>
            </DashboardShell>
          </div>
        </SidebarProvider>
      </MobileNavProvider>
    </AuthGuard>
  );
}
