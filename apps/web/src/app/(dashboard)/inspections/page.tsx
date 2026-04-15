'use client';

import { ClipboardCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { inspectionsApi } from '@/lib/resources';
import type { VehicleInspectionDto } from '@autosphere/shared';

const TYPE_TONE: Record<string, 'blue' | 'amber'> = {
  DEPARTURE: 'blue',
  RETURN: 'amber',
};

const STATUS_TONE: Record<string, 'green' | 'slate'> = {
  COMPLETED: 'green',
  DRAFT: 'slate',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface RowExtra {
  vehicle?: { registration: string; brand: string; model: string };
  contract?: { contractNumber: string };
}

export default function InspectionsPage() {
  const [items, setItems] = useState<(VehicleInspectionDto & RowExtra)[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inspectionsApi
      .list({ pageSize: 50, sortBy: 'performedAt', sortDir: 'desc' })
      .then((r) => {
        setItems(r.items as (VehicleInspectionDto & RowExtra)[]);
        setTotal(r.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, []);

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Inspections"
        description={`${total} inspection${total > 1 ? 's' : ''} (départ + retour)`}
        actions={
          <Link href="/inspections/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle inspection
            </Button>
          </Link>
        }
      />

      <Card>
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">
            {error}
          </div>
        )}
        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Contrat</Th>
              <Th>Véhicule</Th>
              <Th>Km</Th>
              <Th>État</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items === null ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">
                  Chargement…
                </Td>
              </Tr>
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  Aucune inspection enregistrée.
                </Td>
              </Tr>
            ) : (
              items.map((i) => (
                <Tr key={i.id}>
                  <Td>{formatDateTime(i.performedAt)}</Td>
                  <Td>
                    <Badge tone={TYPE_TONE[i.type] ?? 'slate'}>
                      {i.type === 'DEPARTURE' ? 'Départ' : 'Retour'}
                    </Badge>
                  </Td>
                  <Td>
                    <Link
                      href={`/contracts/${i.contractId}`}
                      className="text-slate-900 hover:text-primary-500"
                    >
                      {i.contract?.contractNumber ?? '—'}
                    </Link>
                  </Td>
                  <Td>
                    {i.vehicle ? `${i.vehicle.brand} ${i.vehicle.model} · ${i.vehicle.registration}` : '—'}
                  </Td>
                  <Td>{i.km.toLocaleString('fr-FR')} km</Td>
                  <Td>{i.condition}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[i.status] ?? 'slate'}>{i.status}</Badge>
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
