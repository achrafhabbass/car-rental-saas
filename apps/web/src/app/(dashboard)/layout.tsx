import { ImpersonationBanner } from '@/components/layout/impersonation-banner';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ProtectedRoute>
      {/* Let the body's cream + warm radial gradient show through.
          Previously this wrapper painted slate-50 on top, which both
          flattened the body gradient and prevented the dark sidebar
          from reading correctly against the page. */}
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <ImpersonationBanner />
          <Topbar />
          <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-9 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
