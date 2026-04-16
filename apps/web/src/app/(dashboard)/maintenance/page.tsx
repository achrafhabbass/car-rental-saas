'use client';

import Link from 'next/link';
import { Plus, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { maintenanceApi } from '@/lib/resources';
import type {
  MaintenanceRecordDto,
  MaintenanceScheduleDto,
} from '@autosphere/shared';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecordDto[] | null>(null);
  const [schedules, setSchedules] = useState<MaintenanceScheduleDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      maintenanceApi.listRecords({ pageSize: 50 }),
      maintenanceApi.listSchedules({ status: 'SCHEDULED' }),
    ])
      .then(([r, s]) => {
        setRecords(r.items);
        setSchedules(s);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, []);

  const totalCost =
    records?.reduce((acc, r) => acc + Number(r.cost), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Maintenance"
        description="Historique des entretiens et planning"
        actions={
          <Link href="/maintenance/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvel entretien
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Interventions enregistrées
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {records?.length ?? '—'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Coût total
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalCost.toFixed(2)} MAD
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Entretiens planifiés
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {schedules?.length ?? '—'}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entretiens planifiés</CardTitle>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>Titre</Th>
              <Th>Échéance</Th>
              <Th>Km</Th>
              <Th>Critique</Th>
            </Tr>
          </Thead>
          <Tbody>
            {schedules === null ? (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-400 py-8">
                  Chargement…
                </Td>
              </Tr>
            ) : schedules.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-400 py-8">
                  Aucun entretien planifié.
                </Td>
              </Tr>
            ) : (
              schedules.map((s) => (
                <Tr key={s.id}>
                  <Td>{s.type}</Td>
                  <Td className="font-medium text-slate-900">{s.title}</Td>
                  <Td>{formatDate(s.dueDate)}</Td>
                  <Td>{s.dueKm ? `${s.dueKm.toLocaleString('fr-FR')} km` : '—'}</Td>
                  <Td>
                    {s.isCritical ? (
                      <Badge tone="red">Critique</Badge>
                    ) : (
                      <Badge tone="slate">Normal</Badge>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des interventions</CardTitle>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Titre</Th>
              <Th>Km</Th>
              <Th>Garage</Th>
              <Th>Coût</Th>
            </Tr>
          </Thead>
          <Tbody>
            {records === null ? (
              <Tr>
                <Td colSpan={6} className="text-center text-slate-400 py-8">
                  Chargement…
                </Td>
              </Tr>
            ) : records.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center text-slate-400 py-8">
                  <Wrench className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  Aucune intervention enregistrée.
                </Td>
              </Tr>
            ) : (
              records.map((r) => (
                <Tr key={r.id}>
                  <Td>{formatDate(r.performedAt)}</Td>
                  <Td>{r.type}</Td>
                  <Td className="font-medium text-slate-900">{r.title}</Td>
                  <Td>{r.km ? `${r.km.toLocaleString('fr-FR')} km` : '—'}</Td>
                  <Td>{r.garage ?? '—'}</Td>
                  <Td className="font-semibold">
                    {Number(r.cost).toFixed(2)} MAD
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
