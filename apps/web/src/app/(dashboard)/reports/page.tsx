'use client';

import { Download, FileText, Receipt, CreditCard } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError, downloadFile } from '@/lib/api';
import { analyticsApi } from '@/lib/resources';
import { useAuth } from '@/lib/auth-context';
import type {
  ClientPerformanceDto,
  ReportGranularity,
  RevenuePointDto,
  VehiclePerformanceDto,
} from '@autosphere/shared';

type Window = '7' | '30' | '90' | '365';

const WINDOWS: { value: Window; label: string; granularity: ReportGranularity }[] = [
  { value: '7', label: '7 jours', granularity: 'day' },
  { value: '30', label: '30 jours', granularity: 'day' },
  { value: '90', label: '3 mois', granularity: 'week' },
  { value: '365', label: '12 mois', granularity: 'month' },
];

function fmtMoney(n: number): string {
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD`;
}

function shortLabel(iso: string): string {
  if (iso.includes('-W')) return iso.replace('-W', ' S');
  if (iso.length === 7) {
    const [y, m] = iso.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', {
      month: 'short',
      year: '2-digit',
    });
  }
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const PIE_COLORS = ['#1B3A6B', '#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

export default function ReportsPage() {
  const { hasRole } = useAuth();
  const canExport = hasRole('ADMIN', 'MANAGER', 'ACCOUNTANT');
  const [windowValue, setWindowValue] = useState<Window>('30');
  const [revenue, setRevenue] = useState<RevenuePointDto[] | null>(null);
  const [fleet, setFleet] = useState<VehiclePerformanceDto[] | null>(null);
  const [clients, setClients] = useState<ClientPerformanceDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const windowSpec = WINDOWS.find((w) => w.value === windowValue)!;

  useEffect(() => {
    Promise.all([
      analyticsApi.revenue(Number(windowSpec.value), windowSpec.granularity),
      analyticsApi.fleetPerformance(8),
      analyticsApi.topClients(8),
    ])
      .then(([r, f, c]) => {
        setRevenue(r);
        setFleet(f);
        setClients(c);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) setError(err.message);
      });
  }, [windowSpec.value, windowSpec.granularity]);

  const totalRevenue = useMemo(
    () => revenue?.reduce((acc, p) => acc + p.revenue, 0) ?? 0,
    [revenue],
  );

  async function doExport(kind: 'contracts' | 'invoices' | 'payments') {
    setExporting(kind);
    setError(null);
    try {
      await downloadFile(`/analytics/exports/${kind}.csv`, `${kind}.csv`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Export échoué');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Rapports & Analytique"
        description="Analyses d'activité, flotte et financier"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Période</CardTitle>
          <span className="text-xs text-slate-500">
            Total {fmtMoney(totalRevenue)}
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field label="" htmlFor="window">
            <Select
              id="window"
              value={windowValue}
              onChange={(e) => setWindowValue(e.currentTarget.value as Window)}
            >
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="h-72">
            {revenue === null ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Chargement…
              </div>
            ) : revenue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Aucune donnée.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    tickFormatter={shortLabel}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    formatter={(v) => fmtMoney(Number(v))}
                    labelFormatter={(l) => shortLabel(String(l))}
                    contentStyle={{
                      fontSize: 12,
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Rentabilité par véhicule (top 8)</CardTitle>
          </CardHeader>
          <Table>
            <Thead>
              <Tr>
                <Th>Véhicule</Th>
                <Th>Contrats</Th>
                <Th>CA</Th>
                <Th>Maintenance</Th>
                <Th>Crédit</Th>
                <Th>Net</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fleet === null ? (
                <Tr>
                  <Td colSpan={6} className="text-center text-slate-400 py-8">
                    Chargement…
                  </Td>
                </Tr>
              ) : fleet.length === 0 ? (
                <Tr>
                  <Td colSpan={6} className="text-center text-slate-400 py-8">
                    Aucun véhicule.
                  </Td>
                </Tr>
              ) : (
                fleet.map((v) => (
                  <Tr key={v.vehicleId}>
                    <Td>
                      <div>
                        <p className="font-medium text-slate-900">{v.registration}</p>
                        <p className="text-xs text-slate-400">
                          {v.brand} {v.model}
                        </p>
                      </div>
                    </Td>
                    <Td>{v.contractCount}</Td>
                    <Td className="font-semibold">{fmtMoney(v.totalRevenue)}</Td>
                    <Td className="text-slate-500">{fmtMoney(v.maintenanceCost)}</Td>
                    <Td className="text-slate-500">{fmtMoney(v.creditCost)}</Td>
                    <Td className={v.net >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {fmtMoney(v.net)}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top clients</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-56">
              {clients === null || clients.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  {clients === null ? 'Chargement…' : 'Aucun client'}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clients}
                      dataKey="totalSpent"
                      nameKey="fullName"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={2}
                    >
                      {clients.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmtMoney(Number(v))}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <ul className="space-y-2 text-sm">
              {clients?.map((c, i) => (
                <li key={c.clientId} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 truncate text-slate-700">{c.fullName}</span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {fmtMoney(c.totalSpent)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {canExport && (
        <Card>
          <CardHeader>
            <CardTitle>Exports CSV</CardTitle>
            <span className="text-xs text-slate-500">
              Téléchargement instantané, compatible Excel
            </span>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="secondary"
              onClick={() => doExport('contracts')}
              loading={exporting === 'contracts'}
              className="justify-start"
            >
              <FileText className="h-4 w-4" />
              <span className="flex-1 text-left">Contrats</span>
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => doExport('invoices')}
              loading={exporting === 'invoices'}
              className="justify-start"
            >
              <Receipt className="h-4 w-4" />
              <span className="flex-1 text-left">Factures</span>
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => doExport('payments')}
              loading={exporting === 'payments'}
              className="justify-start"
            >
              <CreditCard className="h-4 w-4" />
              <span className="flex-1 text-left">Paiements</span>
              <Download className="h-3 w-3" />
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
