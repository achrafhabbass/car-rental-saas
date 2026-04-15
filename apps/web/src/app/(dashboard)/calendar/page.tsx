'use client';

import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { calendarApi, vehiclesApi } from '@/lib/resources';
import { cn } from '@/lib/utils';
import type { CalendarRow, VehicleDto } from '@autosphere/shared';

type Granularity = 'day' | 'week' | 'month';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function shiftWindow(anchor: Date, granularity: Granularity, direction: -1 | 0 | 1): Date {
  const next = new Date(anchor);
  if (granularity === 'day') next.setUTCDate(next.getUTCDate() + direction);
  if (granularity === 'week') next.setUTCDate(next.getUTCDate() + 7 * direction);
  if (granularity === 'month') next.setUTCMonth(next.getUTCMonth() + direction);
  return startOfDayUTC(next);
}

function buildAxis(anchor: Date, granularity: Granularity): { from: Date; to: Date; days: Date[] } {
  let from: Date;
  let dayCount: number;
  if (granularity === 'day') {
    from = startOfDayUTC(anchor);
    dayCount = 1;
  } else if (granularity === 'week') {
    from = startOfDayUTC(anchor);
    const dow = from.getUTCDay() || 7; // ISO Monday=1
    from.setUTCDate(from.getUTCDate() - (dow - 1));
    dayCount = 7;
  } else {
    from = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
    const last = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0));
    dayCount = last.getUTCDate();
  }
  const to = new Date(from.getTime() + dayCount * DAY_MS);
  const days = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
  return { from, to, days };
}

function dayLabel(d: Date, granularity: Granularity): string {
  if (granularity === 'month') return String(d.getUTCDate());
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}

const VEHICLE_STATUS_TONE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  RENTED: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
};

function busyClass(kind: string, status: string): string {
  if (kind === 'CONTRACT' && status === 'OVERDUE') return 'bg-red-500/80 text-white';
  if (kind === 'CONTRACT') return 'bg-blue-500/80 text-white';
  // RESERVATION
  if (status === 'CONFIRMED') return 'bg-secondary text-white';
  return 'bg-amber-400/90 text-white';
}

export default function CalendarPage() {
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [anchor, setAnchor] = useState<Date>(startOfDayUTC(new Date()));
  const [vehicleId, setVehicleId] = useState('');
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [rows, setRows] = useState<CalendarRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { from, to, days } = useMemo(() => buildAxis(anchor, granularity), [anchor, granularity]);

  useEffect(() => {
    vehiclesApi
      .list({ pageSize: 200 })
      .then((r) => setVehicles(r.items))
      .catch(() => undefined);
  }, []);

  const load = useCallback(() => {
    setRows(null);
    calendarApi
      .list({
        from: from.toISOString(),
        to: to.toISOString(),
        vehicleId: vehicleId || undefined,
      })
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [from, to, vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  function navigate(direction: -1 | 0 | 1) {
    setAnchor(direction === 0 ? startOfDayUTC(new Date()) : shiftWindow(anchor, granularity, direction));
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Calendrier de disponibilité"
        description="Visualisation des véhicules vs réservations / contrats sur la période choisie"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Field label="Vue" htmlFor="g">
            <Select
              id="g"
              value={granularity}
              onChange={(e) => setGranularity(e.currentTarget.value as Granularity)}
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
            </Select>
          </Field>
          <Field label="Véhicule" htmlFor="v">
            <Select id="v" value={vehicleId} onChange={(e) => setVehicleId(e.currentTarget.value)}>
              <option value="">Tous</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration} · {v.brand} {v.model}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(0)}>
              Aujourd'hui
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(1)}>
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {from.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
            →{' '}
            {new Date(to.getTime() - DAY_MS).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </CardTitle>
          <Legend />
        </CardHeader>
        <CardBody className="overflow-x-auto">
          {rows === null ? (
            <p className="text-center text-sm text-slate-400 py-8">Chargement…</p>
          ) : rows.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Aucun véhicule.</p>
          ) : (
            <div className="min-w-[800px]">
              {/* Header row of days */}
              <div
                className="grid border-b border-slate-200 pb-2"
                style={{ gridTemplateColumns: `220px repeat(${days.length}, minmax(36px, 1fr))` }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
                  Véhicule
                </div>
                {days.map((d) => (
                  <div
                    key={d.toISOString()}
                    className="text-[10px] text-center text-slate-500 font-medium"
                  >
                    {dayLabel(d, granularity)}
                  </div>
                ))}
              </div>

              {/* Vehicle rows */}
              {rows.map((row) => (
                <div
                  key={row.vehicle.id}
                  className="grid border-b border-slate-100 py-2"
                  style={{
                    gridTemplateColumns: `220px repeat(${days.length}, minmax(36px, 1fr))`,
                  }}
                >
                  <div className="px-2">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {row.vehicle.registration}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                      {row.vehicle.brand} {row.vehicle.model}
                      <span
                        className={cn(
                          'inline-flex items-center rounded px-1 py-0.5 text-[9px] font-bold',
                          VEHICLE_STATUS_TONE[row.vehicle.status] ?? 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {row.vehicle.status === 'MAINTENANCE' && (
                          <Wrench className="h-2.5 w-2.5 mr-0.5" />
                        )}
                        {row.vehicle.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-full grid relative" style={{ gridColumn: 'span ' + days.length }}>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(36px, 1fr))` }}
                    >
                      {days.map((d) => (
                        <div
                          key={d.toISOString()}
                          className="h-7 border-l border-slate-100 first:border-l-0"
                        />
                      ))}
                    </div>
                    {row.busy.map((b) => {
                      const bStart = new Date(b.startDate).getTime();
                      const bEnd = new Date(b.endDate).getTime();
                      const winStart = from.getTime();
                      const winEnd = to.getTime();
                      const clampedStart = Math.max(bStart, winStart);
                      const clampedEnd = Math.min(bEnd, winEnd);
                      if (clampedEnd <= clampedStart) return null;
                      const totalMs = winEnd - winStart;
                      const left = ((clampedStart - winStart) / totalMs) * 100;
                      const width = ((clampedEnd - clampedStart) / totalMs) * 100;
                      const href = b.kind === 'CONTRACT' ? `/contracts/${b.id}` : `/reservations/${b.id}`;
                      return (
                        <Link
                          key={b.kind + b.id}
                          href={href}
                          className={cn(
                            'absolute top-1 bottom-1 rounded text-[10px] font-semibold px-1.5 truncate flex items-center',
                            busyClass(b.kind, b.status),
                          )}
                          style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                          title={`${b.kind === 'CONTRACT' ? 'Contrat' : 'Réservation'} · ${b.clientName} · ${b.status}`}
                        >
                          {b.clientName}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] text-slate-600">
      <LegendChip label="Contrat actif" className="bg-blue-500/80 text-white" />
      <LegendChip label="Contrat en retard" className="bg-red-500/80 text-white" />
      <LegendChip label="Réservation confirmée" className="bg-secondary text-white" />
      <LegendChip label="Réservation en attente" className="bg-amber-400/90 text-white" />
    </div>
  );
}

function LegendChip({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 font-semibold', className)}>
      {label}
    </span>
  );
}
