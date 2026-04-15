import { BrandPanel } from '@/components/auth/brand-panel';
import { RedirectIfAuthenticated } from '@/components/layout/protected-route';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RedirectIfAuthenticated>
      <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] bg-slate-50">
        <BrandPanel />
        <section className="relative flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div
            className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-primary-100/60 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md animate-fade-up">{children}</div>
        </section>
      </div>
    </RedirectIfAuthenticated>
  );
}
