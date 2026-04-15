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
import { paymentsApi } from '@/lib/resources';
import type { PaymentDto } from '@autosphere/shared';

const STATUS_TONE: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  CONFIRMED: 'green',
  PENDING: 'amber',
  REFUNDED: 'slate',
  FAILED: 'red',
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

export default function PaymentsPage() {
  const [items, setItems] = useState<PaymentDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  const load = useCallback((q: string) => {
    setSearching(true);
    paymentsApi
      .list({ pageSize: 50, sortBy: 'paidAt', sortDir: 'desc', search: q || undefined })
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
        title="Paiements"
        description={`${total} paiement${total > 1 ? 's' : ''}`}
        actions={
          <Link href="/payments/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau paiement
            </Button>
          </Link>
        }
      />

      <div className="flex justify-end">
        <SearchInput
          onSearch={setSearch}
          loading={searching}
          placeholder="Code, référence…"
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
              <Th>Date</Th>
              <Th>Montant</Th>
              <Th>Méthode</Th>
              <Th>Référence</Th>
              <Th>Statut</Th>
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
                  Aucun paiement enregistré.
                </Td>
              </Tr>
            ) : (
              items.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium text-slate-900">{p.paymentCode}</Td>
                  <Td>{formatDateTime(p.paidAt)}</Td>
                  <Td className="font-semibold">{Number(p.amount).toFixed(2)} MAD</Td>
                  <Td>{p.method}</Td>
                  <Td>{p.reference ?? '—'}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[p.status] ?? 'slate'}>{p.status}</Badge>
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
