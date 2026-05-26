'use client';

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BadgeDollarSign,
  Banknote,
  Car,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { alertsApi, analyticsApi, vehiclesApi } from '@/lib/resources';
import type {
  AlertDto,
  AlertSeverityName,
  DashboardKpisDto,
  RevenuePointDto,
  VehicleDto,
  VehiclePerformanceDto,
} from '@autosphere/shared';

// Cobalt blue, kept under the EMBER identifier so existing references
// (chart strokes, top-vehicle bar tints) flip values without a rename.
const EMBER = '#1E55E8';
const NAVY = '#161A2C';

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}
function fmtMoney(n: number): string {
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`;
}
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const SEVERITY_ICON: Record<AlertSeverityName, { bg: string; color: string; tag: string }> = {
  CRITICAL: { bg: 'bg-rose-soft', color: 'text-rose', tag: 'bg-rose' },
  WARNING: { bg: 'bg-amber-soft', color: 'text-amber', tag: 'bg-amber' },
  INFO: { bg: 'bg-sky-soft', color: 'text-sky', tag: 'bg-sky' },
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpisDto | null>(null);
  const [alerts, setAlerts] = useState<AlertDto[] | null>(null);
  const [series, setSeries] = useState<RevenuePointDto[] | null>(null);
  const [resSeries, setResSeries] = useState<Array<{ week: string; count: number }> | null>(null);
  const [topVehicles, setTopVehicles] = useState<VehiclePerformanceDto[] | null>(null);
  const [fleet, setFleet] = useState<VehicleDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      analyticsApi.dashboard(),
      alertsApi.list({ status: 'OPEN' }),
      analyticsApi.revenue(30, 'day'),
      analyticsApi.reservationsSeries(12),
      analyticsApi.fleetPerformance(5),
      vehiclesApi.list({ pageSize: 6 }),
    ])
      .then(([k, a, s, rs, tv, vl]) => {
        setKpis(k);
        setAlerts(a.slice(0, 3));
        setSeries(s);
        setResSeries(rs);
        setTopVehicles(tv);
        setFleet(vl.items);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) setError(err.message);
      });
  }, []);

  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', { month: 'long' });
  }, []);
  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const monthlyBars = useMemo(() => {
    if (!series) return null;
    // Down-sample to 12 buckets for the mini-bars on the hero card.
    const slice = series.slice(-12);
    const max = Math.max(...slice.map((p) => p.revenue), 1);
    return slice.map((p) => ({ pct: (p.revenue / max) * 100 }));
  }, [series]);

  const firstName = 'Achraf';

  return (
    <div className="space-y-7 max-w-container">
      <PageHeader
        kicker={`Vue d'ensemble · ${todayLabel}`}
        title={`Bonjour,`}
        emphasis={firstName}
        size="lg"
        description="Votre flotte tourne à plein régime. Voici un aperçu de votre performance ce mois-ci."
        actions={
          <>
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Link href="/reservations/new">
              <Button>
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Nouvelle réservation
              </Button>
            </Link>
          </>
        }
      />

      {error && (
        <div className="rounded-2xl bg-rose-soft border border-rose/20 px-5 py-3.5 text-sm text-rose">
          {error}
        </div>
      )}

      {/* ─── Stats grid: hero CA + 3 stats ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-[18px]">
        {kpis ? (
          <>
            <HeroStat
              label={`Chiffre d'affaires · ${monthLabel}`}
              value={fmtMoney(kpis.revenue.thisMonth)}
              delta={kpis.revenue.deltaPct}
              bars={monthlyBars}
            />
            <Stat
              icon={Car}
              tone="ember"
              label="Véhicules"
              value={String(kpis.fleet.available)}
              valueUnit={`/ ${kpis.fleet.total}`}
              trendLabel={`${kpis.occupancy.rateLast30d.toFixed(0)}% occupation`}
              trendTone="up"
            />
            <Stat
              icon={FileText}
              tone="emerald"
              label="Contrats actifs"
              value={String(kpis.contracts.active)}
              trendLabel={`+${kpis.contracts.completedThisMonth}`}
              trendSub="clos ce mois"
              trendTone="up"
            />
            <Stat
              icon={Banknote}
              tone="rose"
              label="Impayés"
              value={fmtMoney(kpis.outstanding.total)}
              trendLabel={`${kpis.outstanding.overdueCount} en retard`}
              trendTone={kpis.outstanding.overdueCount > 0 ? 'down' : 'up'}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} hero={i === 0} />)
        )}
      </div>

      {/* ─── Chart + Alerts ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[18px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                Recettes <span className="em-ember">&</span> Réservations
              </CardTitle>
              <p className="text-[13px] text-ink-mute mt-1">
                30 derniers jours · données en temps réel
              </p>
            </div>
            <Pill>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse-soft" />
              En direct
            </Pill>
          </CardHeader>
          <CardBody>
            <div className="flex gap-5 text-[13px] text-ink-soft mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-ember-500" />
                Recettes (MAD)
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-navy" />
                Réservations
              </div>
            </div>
            <div className="h-60">
              {series === null ? (
                <Skeleton />
              ) : series.length === 0 ? (
                <Empty text="Aucune recette." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emberFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EMBER} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E8DFCF" strokeDasharray="3 4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#8B8FA3' }}
                      tickLine={false}
                      tickFormatter={shortDate}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8B8FA3' }}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip
                      formatter={(v) => fmtMoney(Number(v))}
                      labelFormatter={(l) => shortDate(String(l))}
                      contentStyle={tooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={EMBER}
                      strokeWidth={2.5}
                      fill="url(#emberFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Alertes</CardTitle>
              <p className="text-[13px] text-ink-mute mt-1">À traiter en priorité</p>
            </div>
            <Link
              href="/alerts"
              className="text-[13px] font-semibold text-ember-500 hover:text-ember-600"
            >
              Tout voir →
            </Link>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {alerts === null ? (
              <Skeleton />
            ) : alerts.length === 0 ? (
              <EmptyAlerts />
            ) : (
              alerts.map((a) => <AlertItem key={a.id} alert={a} />)
            )}
          </CardBody>
        </Card>
      </div>

      {/* ─── Fleet section ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-end justify-between mt-3 mb-5">
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
            Flotte <span className="em-ember">en service</span>
          </h2>
          <Link
            href="/vehicles"
            className="text-[13px] font-semibold text-ember-500 hover:text-ember-600"
          >
            Voir toute la flotte →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[18px]">
          {fleet === null
            ? Array.from({ length: 6 }).map((_, i) => <VehicleSkeleton key={i} />)
            : fleet.slice(0, 6).map((v) => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      </div>

      {/* ─── Bottom row: reservations weekly + top vehicles by CA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Réservations par semaine</CardTitle>
              <p className="text-[13px] text-ink-mute mt-1">12 dernières semaines</p>
            </div>
          </CardHeader>
          <CardBody className="h-56">
            {resSeries === null ? (
              <Skeleton />
            ) : resSeries.length === 0 ? (
              <Empty text="Aucune réservation." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resSeries} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid stroke="#E8DFCF" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#8B8FA3' }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8B8FA3' }} tickLine={false} axisLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Réservations" radius={[6, 6, 0, 0]} fill={NAVY} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top véhicules</CardTitle>
              <p className="text-[13px] text-ink-mute mt-1">Par chiffre d'affaires</p>
            </div>
            <BarChart3 className="h-5 w-5 text-ink-mute" />
          </CardHeader>
          <CardBody className="h-56">
            {topVehicles === null ? (
              <Skeleton />
            ) : topVehicles.length === 0 ? (
              <Empty text="Aucun véhicule avec revenus." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVehicles} layout="vertical" margin={{ left: 100, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#E8DFCF" strokeDasharray="3 4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8B8FA3' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="registration"
                    tick={{ fontSize: 11, fill: '#4B5066', fontFamily: 'var(--font-jetbrains)' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip formatter={(v) => fmtMoney(Number(v))} contentStyle={tooltipStyle} />
                  <Bar dataKey="totalRevenue" name="CA" radius={[0, 6, 6, 0]}>
                    {topVehicles.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === 0 ? EMBER : i === 1 ? '#84A6F5' : '#ADC3F8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Hero stat — navy background with ember radial blobs + mini bars chart.
// Matches the mockup's `.stat-hero` directly.
// ─────────────────────────────────────────────────────────────────────────

function HeroStat({
  label,
  value,
  delta,
  bars,
}: {
  label: string;
  value: string;
  delta: number | null;
  bars: Array<{ pct: number }> | null;
}) {
  const deltaUp = (delta ?? 0) >= 0;
  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
      style={{ background: 'linear-gradient(135deg, #161A2C 0%, #232843 100%)' }}
    >
      <div
        className="pointer-events-none absolute -top-2/5 -right-1/5 w-[320px] h-[320px]"
        style={{
          background: 'radial-gradient(circle, rgba(30,85,232,0.5), transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-1/2 -left-[10%] w-[240px] h-[240px]"
        style={{
          background: 'radial-gradient(circle, rgba(91,141,239,0.2), transparent 70%)',
        }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
            {label}
          </p>
          <div className="w-[38px] h-[38px] rounded-[10px] bg-white/10 backdrop-blur grid place-items-center text-ember-glow">
            <BadgeDollarSign className="h-[18px] w-[18px]" />
          </div>
        </div>
        <p className="font-display text-5xl font-medium tracking-[-0.04em] leading-none">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-3.5 text-[13px] text-white/60">
          {delta !== null && (
            <span
              className={
                deltaUp
                  ? 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold bg-emerald/25 text-emerald-soft'
                  : 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold bg-ember-500/25 text-ember-glow'
              }
            >
              {deltaUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {deltaUp ? '+' : ''}
              {delta?.toFixed(1)}%
            </span>
          )}
          <span>vs. mois dernier</span>
        </div>
        {/* Mini bars chart */}
        {bars && (
          <div className="flex items-end gap-[3px] h-9 mt-4">
            {bars.map((b, i) => (
              <div
                key={i}
                className={
                  i === bars.length - 1
                    ? 'flex-1 rounded-t bg-ember-glow'
                    : 'flex-1 rounded-t bg-white/10'
                }
                style={{ height: `${Math.max(b.pct, 4)}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Small stat tiles — three variations sharing one shell.
// ─────────────────────────────────────────────────────────────────────────

type StatTone = 'ember' | 'emerald' | 'rose' | 'amber' | 'sky';

function Stat({
  icon: Icon,
  tone,
  label,
  value,
  valueUnit,
  trendLabel,
  trendSub,
  trendTone,
}: {
  icon: LucideIcon;
  tone: StatTone;
  label: string;
  value: string;
  valueUnit?: string;
  trendLabel?: string;
  trendSub?: string;
  trendTone: 'up' | 'down';
}) {
  const toneClass: Record<StatTone, string> = {
    ember: 'bg-ember-500/10 text-ember-500',
    emerald: 'bg-emerald-soft text-emerald',
    rose: 'bg-rose-soft text-rose',
    amber: 'bg-amber-soft text-amber',
    sky: 'bg-sky-soft text-sky',
  };
  return (
    <div className="rounded-2xl bg-paper border border-line p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-start justify-between mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-mute">
          {label}
        </p>
        <div className={`w-[38px] h-[38px] rounded-[10px] grid place-items-center ${toneClass[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      <div className="font-display text-5xl font-medium tracking-[-0.04em] leading-none text-ink flex items-baseline gap-1.5">
        {value}
        {valueUnit && (
          <span className="font-sans text-base font-medium text-ink-mute tracking-normal">
            {valueUnit}
          </span>
        )}
      </div>
      {trendLabel && (
        <div className="flex items-center gap-2 mt-3.5 text-[13px] text-ink-soft">
          <span
            className={
              trendTone === 'up'
                ? 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold bg-emerald-soft text-emerald'
                : 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold bg-rose-soft text-rose'
            }
          >
            {trendLabel}
          </span>
          {trendSub && <span>{trendSub}</span>}
        </div>
      )}
    </div>
  );
}

function StatSkeleton({ hero }: { hero?: boolean }) {
  return (
    <div
      className={
        hero
          ? 'rounded-2xl bg-navy/90 p-6 animate-pulse min-h-[200px]'
          : 'rounded-2xl bg-paper border border-line p-6 animate-pulse min-h-[180px]'
      }
    >
      <div className={`h-3 w-28 rounded ${hero ? 'bg-white/10' : 'bg-cream-deep'}`} />
      <div className={`mt-6 h-12 w-32 rounded ${hero ? 'bg-white/10' : 'bg-cream-deep'}`} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Alert item — colored icon chip + tag + mono timestamp.
// ─────────────────────────────────────────────────────────────────────────

function AlertItem({ alert }: { alert: AlertDto }) {
  const t = SEVERITY_ICON[alert.severity];
  const date = new Date(alert.createdAt);
  const daysAgo = Math.floor((Date.now() - date.getTime()) / 86400000);
  return (
    <Link
      href="/alerts"
      className="flex gap-3.5 p-4 rounded-2xl bg-cream border border-line-soft transition-all hover:translate-x-0.5 hover:border-line hover:shadow-soft"
    >
      <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${t.bg} ${t.color}`}>
        <AlertTriangle className="h-[18px] w-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink truncate">{alert.title}</p>
          <span
            className={`text-[10px] font-bold tracking-wider text-white rounded px-1.5 py-0.5 uppercase ${t.tag}`}
          >
            {alert.severity}
          </span>
        </div>
        <p className="text-[13px] text-ink-soft leading-snug mt-0.5 line-clamp-2">{alert.message}</p>
        <p className="text-[11px] text-ink-mute mt-1.5 font-mono">
          {date.toLocaleDateString('fr-FR')}
          {daysAgo > 0 && ` · il y a ${daysAgo} j`}
        </p>
      </div>
    </Link>
  );
}

function EmptyAlerts() {
  return (
    <div className="text-center py-8">
      <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-emerald-soft grid place-items-center">
        <CheckCircle2 className="h-6 w-6 text-emerald" />
      </div>
      <p className="text-sm font-medium text-ink">Tout est calme</p>
      <p className="text-[13px] text-ink-mute mt-0.5">Aucune alerte ouverte.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Vehicle card — matches the mockup's fleet grid tile.
// ─────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; class: string }> = {
  AVAILABLE: { label: 'Disponible', class: 'bg-emerald-soft text-emerald' },
  RENTED: { label: 'Loué', class: 'bg-ember-500/10 text-ember-500' },
  MAINTENANCE: { label: 'Maintenance', class: 'bg-amber-soft text-amber' },
  INACTIVE: { label: 'Inactif', class: 'bg-cream-deep text-ink-mute' },
};

function VehicleCard({ vehicle: v }: { vehicle: VehicleDto }) {
  const s = STATUS_LABEL[v.status] ?? STATUS_LABEL.AVAILABLE;
  const dotColor =
    v.status === 'AVAILABLE' ? 'bg-emerald'
    : v.status === 'RENTED' ? 'bg-ember-500'
    : v.status === 'MAINTENANCE' ? 'bg-amber'
    : 'bg-ink-mute';
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="group relative block rounded-2xl bg-paper border border-line p-[22px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated hover:border-ember-500 overflow-hidden"
    >
      {/* Ember top strip on hover */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-grad-ember scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300" />
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-display text-[22px] font-medium tracking-tight leading-tight text-ink">
            {v.brand}
          </p>
          <p className="text-[13px] text-ink-soft">
            {v.model} · {v.year}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1 ${s.class}`}
        >
          <span className={`h-[5px] w-[5px] rounded-full animate-pulse-soft ${dotColor}`} />
          {s.label}
        </span>
      </div>
      <p className="font-mono text-[12px] text-ink-mute font-medium mb-4">{v.registration}</p>
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dashed border-line">
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-ink-mute font-semibold">
            Tarif / jour
          </p>
          <p className="text-[15px] font-semibold text-ink mt-0.5">
            {fmt(Number(v.dailyRate))}{' '}
            <span className="text-[11px] text-ink-mute font-medium">MAD</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.1em] text-ink-mute font-semibold">
            Kilométrage
          </p>
          <p className="text-[15px] font-semibold text-ink mt-0.5">
            {fmt(v.currentKm)}{' '}
            <span className="text-[11px] text-ink-mute font-medium">km</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

function VehicleSkeleton() {
  return (
    <div className="rounded-2xl bg-paper border border-line p-[22px] animate-pulse">
      <div className="h-6 w-32 bg-cream-deep rounded" />
      <div className="mt-2 h-3 w-24 bg-cream-deep/70 rounded" />
      <div className="mt-4 h-3 w-20 bg-cream-deep rounded" />
      <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-dashed border-line">
        <div className="h-12 bg-cream-deep/60 rounded" />
        <div className="h-12 bg-cream-deep/60 rounded" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Misc helpers
// ─────────────────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-cream-deep text-ink-soft">
      {children}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-ink-mute">
      Chargement…
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-ink-mute">{text}</div>
  );
}

const tooltipStyle: React.CSSProperties = {
  fontSize: 12,
  border: '1px solid #E8DFCF',
  borderRadius: 14,
  background: '#FFFEFB',
  boxShadow: '0 8px 24px rgba(22,26,44,0.08)',
  fontFamily: 'var(--font-jakarta)',
};
