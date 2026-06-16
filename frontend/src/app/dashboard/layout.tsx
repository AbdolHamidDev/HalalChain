import { AuthGuard } from "@/components/auth/auth-guard";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { DashboardClient } from "@/components/layout/dashboard-client";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MobileNavProvider } from "@/components/layout/mobile-nav-provider";
import { PageTransition } from "@/components/shared/page-transition";
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
          <div className="flex min-h-dvh bg-background lg:h-dvh lg:overflow-hidden">
            <Sidebar />
            <DashboardShell>
              <DashboardHeader />
              <main className="flex-1 lg:overflow-y-auto pb-20 lg:pb-0 overscroll-contain">
                <PageTransition>
                  <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
                    {children}
                  </div>
                </PageTransition>
              </main>
            </DashboardShell>
          </div>
          <BottomTabBar />
          <DashboardClient />
        </SidebarProvider>
      </MobileNavProvider>
    </AuthGuard>
  );
}