'use client';

import { useCallback, useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import { Field, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { platformApi } from '@/lib/resources';
import type {
  PlatformAuditActionName,
  PlatformAuditLogDto,
} from '@autosphere/shared';

const ACTION_TONE: Record<PlatformAuditActionName, 'red' | 'amber' | 'blue' | 'green' | 'slate'> = {
  IMPERSONATE: 'amber',
  TENANT_UPDATE: 'blue',
  TENANT_SUSPEND: 'amber',
  TENANT_ACTIVATE: 'green',
  TENANT_CANCEL: 'red',
  TENANT_DELETE: 'red',
  TENANT_EXTEND_TRIAL: 'blue',
  TENANT_EXTEND_SUBSCRIPTION: 'green',
  SWEEP_EXPIRIES: 'slate',
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

export default function PlatformAuditPage() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<PlatformAuditLogDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<PlatformAuditActionName | ''>('');

  const load = useCallback(() => {
    platformApi
      .auditLogs({ action: action || undefined, limit: 200 })
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [action]);

  useEffect(() => {
    if (!hasRole('SUPER_ADMIN')) return;
    load();
  }, [hasRole, load]);

  if (!hasRole('SUPER_ADMIN')) {
    return (
      <div className="max-w-container">
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Cette section est réservée aux super-administrateurs.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Journal d'audit"
        description="Trace de toutes les actions effectuées par les super-admins"
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <div className="p-5 border-b border-slate-200 max-w-xs">
          <Field label="Filtrer par action" htmlFor="action">
            <Select
              id="action"
              value={action}
              onChange={(e) => setAction(e.currentTarget.value as PlatformAuditActionName | '')}
            >
              <option value="">Toutes</option>
              <option value="IMPERSONATE">Impersonation</option>
              <option value="TENANT_UPDATE">Mise à jour</option>
              <option value="TENANT_SUSPEND">Suspension</option>
              <option value="TENANT_ACTIVATE">Activation</option>
              <option value="TENANT_CANCEL">Résiliation</option>
              <option value="TENANT_DELETE">Suppression</option>
              <option value="TENANT_EXTEND_TRIAL">Prolongation essai</option>
              <option value="TENANT_EXTEND_SUBSCRIPTION">Prolongation abo</option>
              <option value="SWEEP_EXPIRIES">Sweep expiries</option>
            </Select>
          </Field>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Action</Th>
              <Th>Tenant</Th>
              <Th>Acteur</Th>
              <Th>Métadonnées</Th>
              <Th>IP</Th>
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
                  Aucune entrée pour ce filtre.
                </Td>
              </Tr>
            ) : (
              items.map((a) => (
                <Tr key={a.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(a.createdAt)}</Td>
                  <Td>
                    <Badge tone={ACTION_TONE[a.action] ?? 'slate'}>{a.action}</Badge>
                  </Td>
                  <Td className="font-mono text-xs">
                    {a.tenantId?.slice(0, 8) ?? '—'}
                  </Td>
                  <Td className="font-mono text-xs">
                    {a.actorUserId?.slice(0, 8) ?? '—'}
                  </Td>
                  <Td>
                    {a.metadata ? (
                      <code className="text-xs text-slate-600 break-all">
                        {JSON.stringify(a.metadata)}
                      </code>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </Td>
                  <Td className="text-xs text-slate-500">{a.ipAddress ?? '—'}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
