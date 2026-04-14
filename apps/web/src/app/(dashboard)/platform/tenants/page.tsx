'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { platformApi } from '@/lib/resources';
import type { TenantDto, TenantStatusName } from '@autosphere/shared';

const STATUS_TONE: Record<TenantStatusName, 'green' | 'amber' | 'red' | 'slate' | 'blue'> = {
  ACTIVE: 'green',
  TRIAL: 'blue',
  SUSPENDED: 'amber',
  EXPIRED: 'red',
  CANCELLED: 'slate',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PlatformTenantsPage() {
  const [items, setItems] = useState<TenantDto[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    platformApi
      .listTenants({
        status: status || undefined,
        plan: plan || undefined,
        q: q || undefined,
        pageSize: 100,
      })
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [status, plan, q]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Tenants"
        description={`${total} entreprise${total > 1 ? 's' : ''} sur la plateforme`}
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <div className="p-5 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Recherche" htmlFor="q">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="q"
                className="pl-9"
                placeholder="Nom, slug, email de facturation"
                value={q}
                onChange={(e) => setQ(e.currentTarget.value)}
              />
            </div>
          </Field>
          <Field label="Statut" htmlFor="f-status">
            <Select
              id="f-status"
              value={status}
              onChange={(e) => setStatus(e.currentTarget.value)}
            >
              <option value="">Tous</option>
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="SUSPENDED">Suspendu</option>
              <option value="EXPIRED">Expiré</option>
              <option value="CANCELLED">Résilié</option>
            </Select>
          </Field>
          <Field label="Plan" htmlFor="f-plan">
            <Select id="f-plan" value={plan} onChange={(e) => setPlan(e.currentTarget.value)}>
              <option value="">Tous</option>
              <option value="STARTER">Starter</option>
              <option value="BUSINESS">Business</option>
              <option value="ENTERPRISE">Enterprise</option>
            </Select>
          </Field>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Nom</Th>
              <Th>Slug</Th>
              <Th>Plan</Th>
              <Th>Statut</Th>
              <Th>Essai</Th>
              <Th>Fin abo</Th>
              <Th>Créé</Th>
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
                  Aucun tenant ne correspond aux filtres.
                </Td>
              </Tr>
            ) : (
              items.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="font-medium text-slate-900 hover:text-primary-500"
                    >
                      {t.name}
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs text-slate-500">{t.slug}</Td>
                  <Td>
                    <Badge tone="blue">{t.plan}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[t.status] ?? 'slate'}>{t.status}</Badge>
                  </Td>
                  <Td>{formatDate(t.trialEndsAt)}</Td>
                  <Td>{formatDate(t.subscriptionEnd)}</Td>
                  <Td>{formatDate(t.createdAt)}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
