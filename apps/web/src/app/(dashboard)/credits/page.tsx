'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { creditsApi } from '@/lib/resources';
import type { VehicleCreditDto } from '@autosphere/shared';

const STATUS_TONE: Record<string, 'green' | 'blue' | 'red' | 'slate'> = {
  ACTIVE: 'blue',
  PAID_OFF: 'green',
  DEFAULTED: 'red',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CreditsPage() {
  const [items, setItems] = useState<VehicleCreditDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    creditsApi
      .list({ pageSize: 50, sortBy: 'createdAt', sortDir: 'desc' })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, []);

  const totalDebt =
    items?.reduce((acc, c) => acc + Number(c.remainingBalance), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Crédits & Financement"
        description={`${total} crédit${total > 1 ? 's' : ''} · endettement total ${totalDebt.toFixed(2)} MAD`}
        actions={
          <Link href="/credits/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau crédit
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
              <Th>Banque</Th>
              <Th>Type</Th>
              <Th>Principal</Th>
              <Th>Mensualité</Th>
              <Th>Capital restant</Th>
              <Th>Échéance finale</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items === null ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">Chargement…</Td>
              </Tr>
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">
                  Aucun crédit.
                </Td>
              </Tr>
            ) : (
              items.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/credits/${c.id}`} className="font-medium text-slate-900 hover:text-primary-500">
                      {c.bankName}
                    </Link>
                  </Td>
                  <Td>{c.creditType === 'LEASING' ? 'Leasing' : 'Crédit bancaire'}</Td>
                  <Td>{Number(c.principal).toFixed(2)} MAD</Td>
                  <Td>{Number(c.monthlyPayment).toFixed(2)} MAD</Td>
                  <Td className="font-semibold">{Number(c.remainingBalance).toFixed(2)} MAD</Td>
                  <Td>{formatDate(c.endDate)}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[c.status] ?? 'slate'}>{c.status}</Badge>
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
