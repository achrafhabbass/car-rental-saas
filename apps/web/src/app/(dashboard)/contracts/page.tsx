'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { contractsApi } from '@/lib/resources';
import type { RentalContractDto } from '@autosphere/shared';

const STATUS_TONE: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  DRAFT: 'slate',
  ACTIVE: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ContractsPage() {
  const [items, setItems] = useState<RentalContractDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contractsApi
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
        title="Contrats"
        description={`${total} contrat${total > 1 ? 's' : ''}`}
        actions={
          <Link href="/contracts/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau contrat
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
              <Th>N° Contrat</Th>
              <Th>Période</Th>
              <Th>Statut</Th>
              <Th>Km</Th>
              <Th>Total</Th>
              <Th>Caution</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items === null ? (
              <Tr>
                <Td colSpan={6} className="text-center text-slate-400 py-8">Chargement…</Td>
              </Tr>
            ) : items.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center text-slate-400 py-8">
                  Aucun contrat.
                </Td>
              </Tr>
            ) : (
              items.map((c) => (
                <Tr key={c.id}>
                  <Td className="font-medium text-slate-900">{c.contractNumber}</Td>
                  <Td>
                    {formatDate(c.startDate)} → {formatDate(c.endDate)}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[c.status] ?? 'slate'}>{c.status}</Badge>
                  </Td>
                  <Td>
                    {c.kmStart.toLocaleString('fr-FR')}
                    {c.kmEnd !== null && ` → ${c.kmEnd.toLocaleString('fr-FR')}`}
                  </Td>
                  <Td>{Number(c.totalAmount).toFixed(2)} MAD</Td>
                  <Td>
                    {Number(c.depositAmount).toFixed(2)} MAD
                    {c.depositMethod && (
                      <span className="ml-1 text-xs text-slate-400">({c.depositMethod})</span>
                    )}
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
