'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { reservationsApi } from '@/lib/resources';
import type { ReservationDto } from '@autosphere/shared';

const STATUS_TONE: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  PENDING: 'amber',
  CONFIRMED: 'blue',
  CONVERTED: 'green',
  CANCELLED: 'red',
  NO_SHOW: 'slate',
  OVERDUE: 'red',
  COMPLETED: 'green',
};

const PAYMENT_TONE: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  PENDING: 'amber',
  PARTIAL: 'amber',
  PAID: 'green',
  REFUNDED: 'slate',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReservationsPage() {
  const [items, setItems] = useState<ReservationDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  const load = useCallback((q: string) => {
    setSearching(true);
    reservationsApi
      .list({ pageSize: 50, sortBy: 'startDate', sortDir: 'desc', search: q || undefined })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
        setError(null);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      )
      .finally(() => setSearching(false));
  }, []);

  useEffect(() => {
    load(search);
  }, [load, search]);

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Réservations"
        description={`${total} réservation${total > 1 ? 's' : ''}`}
        actions={
          <Link href="/reservations/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle réservation
            </Button>
          </Link>
        }
      />

      <div className="flex justify-end">
        <SearchInput
          onSearch={setSearch}
          loading={searching}
          placeholder="Code, client, immatriculation…"
        />
      </div>

      <Card>
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">
            {error}
          </div>
        )}
        <Table>
          <Thead>
            <Tr>
              <Th>Code</Th>
              <Th>Période</Th>
              <Th>Statut</Th>
              <Th>Paiement</Th>
              <Th>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items === null ? (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-400 py-8">Chargement…</Td>
              </Tr>
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-400 py-8">
                  Aucune réservation.
                </Td>
              </Tr>
            ) : (
              items.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <Link
                      href={`/reservations/${r.id}`}
                      className="font-medium text-slate-900 hover:text-primary-500"
                    >
                      {r.reservationCode}
                    </Link>
                  </Td>
                  <Td>
                    {formatDate(r.startDate)} → {formatDate(r.endDate)}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[r.status] ?? 'slate'}>{r.status}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={PAYMENT_TONE[r.paymentStatus] ?? 'slate'}>
                      {r.paymentStatus}
                    </Badge>
                  </Td>
                  <Td>{Number(r.totalAmount).toFixed(2)} MAD</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
