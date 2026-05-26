import { BrandPanel } from '@/components/auth/brand-panel';
import { RedirectIfAuthenticated } from '@/components/layout/protected-route';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] bg-cream">
        <BrandPanel />
        <section className="relative flex items-center justify-center p-6 sm:p-10 lg:p-12">
          {/* Warm ember + ink blooms — keep the form side anchored in the
              same palette as the dashboard. */}
          <div
            className="pointer-events-none absolute top-0 right-0 h-72 w-72 rounded-full bg-ember-100/70 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-navy/[0.04] blur-3xl"
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md animate-fade-in">{children}</div>
        </section>
      </div>
    </RedirectIfAuthenticated>
  );
}
