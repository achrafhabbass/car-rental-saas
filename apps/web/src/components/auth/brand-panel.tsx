import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const STATS = [
  { value: '12k+', label: 'Contrats signés' },
  { value: '850+', label: 'Agences partenaires' },
  { value: '99.9%', label: 'Disponibilité' },
];

const FEATURES = [
  'Flotte, clients & contrats centralisés',
  'Facturation et paiements intégrés',
  'Rapports temps réel · multi-agence',
];

export function BrandPanel() {
  return (
    <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-900 p-12 text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-secondary/40 blur-3xl animate-blob"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-10 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-blob"
        style={{ animationDelay: '-6s' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-grid-white opacity-40" aria-hidden="true" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 flex items-center justify-center shadow-lg">
          <span className="text-lg font-black tracking-tight">A</span>
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight">AutoSphere</p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-primary-100">
            Car Rental · SaaS
          </p>
        </div>
      </div>

      {/* 3D illustration */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-8 perspective-1000">
        <div
          className="relative w-full max-w-md preserve-3d animate-float-slow"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Floating dashboard card */}
          <div
            className="relative rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/20 p-5 shadow-2xl animate-tilt"
            style={{ transform: 'rotateX(10deg) rotateY(-15deg)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <Sparkles className="h-3.5 w-3.5 text-white/60" />
            </div>

            {/* Mini KPI grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { k: 'Actifs', v: '124' },
                { k: 'Réservés', v: '37' },
                { k: 'Maint.', v: '08' },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-lg bg-white/5 ring-1 ring-white/10 px-2.5 py-2"
                >
                  <p className="text-[9px] uppercase tracking-wider text-white/60">
                    {s.k}
                  </p>
                  <p className="text-base font-bold">{s.v}</p>
                </div>
              ))}
            </div>

            {/* Fake chart bars */}
            <div className="flex items-end gap-1.5 h-16">
              {[40, 65, 48, 82, 58, 90, 72, 95, 68, 84, 58, 78].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-gradient-to-t from-secondary to-secondary/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-wider text-white/50">
              Réservations · 7 derniers jours
            </p>
          </div>

          {/* Floating car chip */}
          <div
            className="absolute -left-6 -bottom-8 rounded-xl bg-white/95 text-slate-900 px-4 py-3 shadow-2xl ring-1 ring-black/5 flex items-center gap-3"
            style={{ transform: 'translateZ(50px) rotate(-4deg)' }}
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center text-white shadow-md">
              {/* Car icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v1a1 1 0 1 1-2 0v-1H7v1a1 1 0 1 1-2 0v-1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1zm2 0h10l-1.1-3.3a.5.5 0 0 0-.5-.37H8.6a.5.5 0 0 0-.5.37L7 11zm-.5 4.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm11 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Contrat signé
              </p>
              <p className="text-sm font-bold">Peugeot 208 · 3 jours</p>
            </div>
          </div>

          {/* Floating shield chip */}
          <div
            className="absolute -right-4 -top-6 rounded-xl bg-white/10 backdrop-blur-xl ring-1 ring-white/25 px-3 py-2 flex items-center gap-2 shadow-xl"
            style={{ transform: 'translateZ(30px) rotate(6deg)' }}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span className="text-xs font-semibold">ISO · SOC 2</span>
          </div>
        </div>
      </div>

      {/* Features + stats */}
      <div className="relative z-10 space-y-8">
        <ul className="space-y-2.5">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-primary-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-primary-200 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-primary-200/70">
          © {new Date().getFullYear()} AutoSphere · Tous droits réservés
        </p>
      </div>
    </section>
  );
}
