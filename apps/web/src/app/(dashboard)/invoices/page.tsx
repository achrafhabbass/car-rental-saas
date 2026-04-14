'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { invoicesApi } from '@/lib/resources';
import type { InvoiceDto } from '@autosphere/shared';

const STATUS_TONE: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  DRAFT: 'slate',
  ISSUED: 'blue',
  PARTIAL: 'amber',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'slate',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function InvoicesPage() {
  const [items, setItems] = useState<InvoiceDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoicesApi
      .list({ pageSize: 50, sortBy: 'issueDate', sortDir: 'desc' })
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
        title="Factures"
        description={`${total} facture${total > 1 ? 's' : ''}`}
        actions={
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouvelle facture
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
              <Th>N° Facture</Th>
              <Th>Émission</Th>
              <Th>Échéance</Th>
              <Th>Total TTC</Th>
              <Th>Solde</Th>
              <Th>Statut</Th>
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
                  Aucune facture.
                </Td>
              </Tr>
            ) : (
              items.map((i) => (
                <Tr key={i.id}>
                  <Td className="font-medium text-slate-900">{i.invoiceNumber}</Td>
                  <Td>{formatDate(i.issueDate)}</Td>
                  <Td>{i.dueDate ? formatDate(i.dueDate) : '—'}</Td>
                  <Td className="font-semibold">{Number(i.total).toFixed(2)} MAD</Td>
                  <Td>{Number(i.balance).toFixed(2)} MAD</Td>
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
