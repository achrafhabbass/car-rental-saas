const STATS = [
  { label: 'Véhicules disponibles', value: '—', sub: 'sur — du parc' },
  { label: 'Contrats actifs', value: '—', sub: 'en cours' },
  { label: "CA du mois", value: '— MAD', sub: 'vs mois dernier' },
  { label: 'Impayés', value: '— MAD', sub: 'à recouvrer' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-container">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-1">
          Vue d'ensemble de votre activité de location.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm min-h-[320px]">
          <h2 className="text-sm font-semibold text-slate-900">Évolution du CA (12 mois)</h2>
          <div className="mt-4 h-64 flex items-center justify-center text-sm text-slate-400">
            Graphique à venir
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Retours du jour</h2>
          <div className="mt-4 text-sm text-slate-400">Aucun retour prévu.</div>
        </div>
      </div>
    </div>
  );
}
