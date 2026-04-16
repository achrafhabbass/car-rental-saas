'use client';

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Car,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { alertsApi, analyticsApi } from '@/lib/resources';
import type {
  AlertDto,
  AlertSeverityName,
  DashboardKpisDto,
  RevenuePointDto,
  VehiclePerformanceDto,
} from '@autosphere/shared';

const SEVERITY_TONE: Record<AlertSeverityName, 'red' | 'amber' | 'blue'> = {
  CRITICAL: 'red',
  WARNING: 'amber',
  INFO: 'blue',
};

const PRIMARY = '#1B3A6B';
const SECONDARY = '#2563EB';
const ACCENT = '#F59E0B';
const SUCCESS = '#10B981';
const BAR_COLORS = [SECONDARY, '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function fmtMoney(n: number): string {
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpisDto | null>(null);
  const [alerts, setAlerts] = useState<AlertDto[] | null>(null);
  const [series, setSeries] = useState<RevenuePointDto[] | null>(null);
  const [monthlySeries, setMonthlySeries] = useState<RevenuePointDto[] | null>(null);
  const [resSeries, setResSeries] = useState<Array<{ week: string; count: number }> | null>(null);
  const [topVehicles, setTopVehicles] = useState<VehiclePerformanceDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      analyticsApi.dashboard(),
      alertsApi.list({ status: 'OPEN' }),
      analyticsApi.revenue(30, 'day'),
      analyticsApi.revenue(365, 'month'),
      analyticsApi.reservationsSeries(12),
      analyticsApi.fleetPerformance(5),
    ])
      .then(([k, a, s, ms, rs, tv]) => {
        setKpis(k);
        setAlerts(a.slice(0, 6));
        setSeries(s);
        setMonthlySeries(ms);
        setResSeries(rs);
        setTopVehicles(tv);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) setError(err.message);
      });
  }, []);

  const stats = useMemo(() => {
    if (!kpis) return null;
    const delta = kpis.revenue.deltaPct;
    return [
      {
        label: 'Véhicules disponibles',
        value: fmt(kpis.fleet.available),
        sub: `sur ${fmt(kpis.fleet.total)} du parc`,
        delta: null as number | null,
        tone: undefined as 'warn' | undefined,
      },
      {
        label: 'Contrats actifs',
        value: fmt(kpis.contracts.active),
        sub: `+${fmt(kpis.contracts.completedThisMonth)} clos ce mois`,
        delta: null,
        tone: undefined,
      },
      {
        label: 'CA du mois',
        value: fmtMoney(kpis.revenue.thisMonth),
        sub:
          delta === null
            ? 'pas de référence'
            : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs mois dernier`,
        delta,
        tone: undefined,
      },
      {
        label: 'Impayés',
        value: fmtMoney(kpis.outstanding.total),
        sub: `${fmt(kpis.outstanding.overdueCount)} en retard`,
        delta: null,
        tone: kpis.outstanding.overdueCount > 0 ? ('warn' as const) : undefined,
      },
    ];
  }, [kpis]);

  return (
    <div className="space-y-6 max-w-container">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-1">
          Vue d'ensemble de votre activité de location.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats
          ? stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{s.value}</p>
                <p
                  className={`text-xs mt-1 inline-flex items-center gap-1 ${
                    s.delta !== null
                      ? s.delta >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                      : s.tone === 'warn'
                        ? 'text-amber-600'
                        : 'text-slate-400'
                  }`}
                >
                  {s.delta !== null ? (
                    s.delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                  {s.sub}
                </p>
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                <div className="mt-3 h-7 w-16 bg-slate-100 rounded animate-pulse" />
                <div className="mt-2 h-3 w-20 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
      </div>

      {/* Row 1: Revenue 30d + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recettes (30 derniers jours)</CardTitle>
            {kpis && (
              <span className="text-xs text-slate-500">
                Taux d'occupation · {kpis.occupancy.rateLast30d.toFixed(1)}%
              </span>
            )}
          </CardHeader>
          <CardBody className="h-72">
            {series === null ? (
              <Skeleton />
            ) : series.length === 0 ? (
              <Empty text="Aucune recette sur la période." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} tickFormatter={shortDate} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip formatter={(v) => fmtMoney(Number(v))} labelFormatter={(l) => shortDate(String(l))} contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="revenue" stroke={SECONDARY} strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes ouvertes</CardTitle>
            <Link href="/alerts" className="text-xs font-medium text-secondary hover:underline">
              Voir tout
            </Link>
          </CardHeader>
          <CardBody className="space-y-2">
            {alerts === null ? (
              <Skeleton />
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
                  <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${a.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : a.severity === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    <AlertTriangle className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate flex-1">{a.title}</p>
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

      {/* Row 2: Reservations/week + Monthly revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Réservations / semaine (12 sem.)</CardTitle>
          </CardHeader>
          <CardBody className="h-64">
            {resSeries === null ? (
              <Skeleton />
            ) : resSeries.length === 0 ? (
              <Empty text="Aucune réservation." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                  <Bar dataKey="count" name="Réservations" radius={[4, 4, 0, 0]} fill={SUCCESS} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CA mensuel (12 mois)</CardTitle>
          </CardHeader>
          <CardBody className="h-64">
            {monthlySeries === null ? (
              <Skeleton />
            ) : monthlySeries.length === 0 ? (
              <Empty text="Aucune donnée." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip formatter={(v) => fmtMoney(Number(v))} contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }} />
                  <Bar dataKey="revenue" name="CA" radius={[4, 4, 0, 0]} fill={PRIMARY} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Row 3: Top 5 vehicles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary-500" />
            Top 5 véhicules (par CA)
          </CardTitle>
        </CardHeader>
        <CardBody className="h-56">
          {topVehicles === null ? (
            <Skeleton />
          ) : topVehicles.length === 0 ? (
            <Empty text="Aucun véhicule avec revenus." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVehicles} layout="vertical" margin={{ left: 100, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="registration"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(v) => fmtMoney(Number(v))}
                  contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
                <Bar dataKey="totalRevenue" name="CA" radius={[0, 4, 4, 0]}>
                  {topVehicles.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-slate-400">
      Chargement…
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-slate-400">
      {text}
    </div>
  );
}
