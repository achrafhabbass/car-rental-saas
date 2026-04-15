'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { clientsApi } from '@/lib/resources';
import type { ClientDto } from '@autosphere/shared';

const SEGMENT_TONE: Record<string, 'green' | 'blue' | 'amber' | 'slate' | 'red'> = {
  VIP: 'blue',
  REGULAR: 'slate',
  OCCASIONAL: 'amber',
  AT_RISK: 'red',
};

export default function ClientsPage() {
  const [items, setItems] = useState<ClientDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientsApi
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
        title="Clients"
        description={`${total} client${total > 1 ? 's' : ''}`}
        actions={
          <Link href="/clients/new">
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau client
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
              <Th>Nom</Th>
              <Th>Type</Th>
              <Th>Pièce d'identité</Th>
              <Th>Contact</Th>
              <Th>Segment</Th>
              <Th>Note</Th>
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
                  Aucun client. Cliquez sur « Nouveau client ».
                </Td>
              </Tr>
            ) : (
              items.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-medium text-slate-900 hover:text-primary-500"
                    >
                      {c.fullName}
                    </Link>
                    {c.blacklisted && (
                      <Badge tone="red">
                        <span className="ml-2">Blacklisté</span>
                      </Badge>
                    )}
                  </Td>
                  <Td>{c.type === 'COMPANY' ? 'Entreprise' : 'Particulier'}</Td>
                  <Td>{c.idNumber}</Td>
                  <Td>
                    <div className="flex flex-col">
                      <span>{c.phone ?? '—'}</span>
                      <span className="text-xs text-slate-400">{c.email ?? ''}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={SEGMENT_TONE[c.segment] ?? 'slate'}>{c.segment}</Badge>
                  </Td>
                  <Td>{Number(c.rating).toFixed(1)} / 5</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
