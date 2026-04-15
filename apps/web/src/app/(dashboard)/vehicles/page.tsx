'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { vehiclesApi } from '@/lib/resources';
import type { VehicleDto } from '@autosphere/shared';

const STATUS_TONE: Record<string, 'green' | 'blue' | 'amber' | 'slate'> = {
  AVAILABLE: 'green',
  RENTED: 'blue',
  MAINTENANCE: 'amber',
  INACTIVE: 'slate',
};

export default function VehiclesPage() {
  const [items, setItems] = useState<VehicleDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vehiclesApi
      .list({ pageSize: 50, sortBy: 'createdAt', sortDir: 'desc' })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, []);

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Véhicules"
        description={`${total} véhicule${total > 1 ? 's' : ''} dans le parc`}
        actions={
          <Link href="/vehicles/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau véhicule
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
              <Th>Immatriculation</Th>
              <Th>Marque / Modèle</Th>
              <Th>Année</Th>
              <Th>Statut</Th>
              <Th>Km</Th>
              <Th>Tarif/jour</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items === null ? (
              <Tr>
                <Td colSpan={6} className="text-center text-slate-400 py-8">
                  Chargement…
                </Td>
              </Tr>
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center text-slate-400 py-8">
                  Aucun véhicule. Cliquez sur « Nouveau véhicule » pour commencer.
                </Td>
              </Tr>
            ) : (
              items.map((v) => (
                <Tr key={v.id}>
                  <Td>
                    <Link
                      href={`/vehicles/${v.id}`}
                      className="font-medium text-slate-900 hover:text-primary-500"
                    >
                      {v.registration}
                    </Link>
                  </Td>
                  <Td>
                    {v.brand} {v.model}
                  </Td>
                  <Td>{v.year}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[v.status] ?? 'slate'}>{v.status}</Badge>
                  </Td>
                  <Td>{v.currentKm.toLocaleString('fr-FR')} km</Td>
                  <Td>{Number(v.dailyRate).toFixed(2)} MAD</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
