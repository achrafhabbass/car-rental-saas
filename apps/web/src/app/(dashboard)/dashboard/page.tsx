'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { alertsApi } from '@/lib/resources';
import type { AlertDto, AlertSeverityName } from '@autosphere/shared';

const STATS = [
  { label: 'Véhicules disponibles', value: '—', sub: 'sur — du parc' },
  { label: 'Contrats actifs', value: '—', sub: 'en cours' },
  { label: 'CA du mois', value: '— MAD', sub: 'vs mois dernier' },
  { label: 'Impayés', value: '— MAD', sub: 'à recouvrer' },
];

const SEVERITY_TONE: Record<AlertSeverityName, 'red' | 'amber' | 'blue'> = {
  CRITICAL: 'red',
  WARNING: 'amber',
  INFO: 'blue',
};

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<AlertDto[] | null>(null);

  useEffect(() => {
    alertsApi
      .list({ status: 'OPEN' })
      .then((list) => setAlerts(list.slice(0, 6)))
      .catch((err: unknown) => {
        if (err instanceof ApiError) setAlerts([]);
      });
  }, []);

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

        <Card>
          <CardHeader>
            <CardTitle>Alertes ouvertes</CardTitle>
            <Link href="/alerts" className="text-xs font-medium text-secondary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardBody className="space-y-2">
            {alerts === null ? (
              <p className="text-sm text-slate-400 text-center py-6">Chargement…</p>
            ) : alerts.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                Aucune alerte ouverte.
              </div>
            ) : (
              alerts.map((a) => (
                <Link
                  key={a.id}
                  href="/alerts"
                  className="flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-md shrink-0 ${
                      a.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-600'
                        : a.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate flex-1">
                        {a.title}
                      </p>
                      <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{a.message}</p>
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
