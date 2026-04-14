'use client';

import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { alertsApi } from '@/lib/resources';
import type {
  AlertDto,
  AlertSeverityName,
  AlertStatusName,
  AlertSummaryDto,
} from '@autosphere/shared';

const SEVERITY_TONE: Record<AlertSeverityName, 'red' | 'amber' | 'blue'> = {
  CRITICAL: 'red',
  WARNING: 'amber',
  INFO: 'blue',
};

const STATUS_TONE: Record<AlertStatusName, 'red' | 'amber' | 'green'> = {
  OPEN: 'red',
  ACKNOWLEDGED: 'amber',
  RESOLVED: 'green',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AlertsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'MANAGER');
  const [alerts, setAlerts] = useState<AlertDto[] | null>(null);
  const [summary, setSummary] = useState<AlertSummaryDto | null>(null);
  const [status, setStatus] = useState<AlertStatusName | ''>('OPEN');
  const [severity, setSeverity] = useState<AlertSeverityName | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([
        alertsApi.list({
          status: status || undefined,
          severity: severity || undefined,
        }),
        alertsApi.summary(),
      ]);
      setAlerts(list);
      setSummary(sum);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement échoué');
    }
  }, [status, severity]);

  useEffect(() => {
    load();
  }, [load]);

  async function resync() {
    setBusy(true);
    setError(null);
    try {
      await alertsApi.resync();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Resync échouée');
    } finally {
      setBusy(false);
    }
  }

  async function act(id: string, action: 'acknowledge' | 'resolve') {
    setBusy(true);
    try {
      if (action === 'acknowledge') await alertsApi.acknowledge(id);
      else await alertsApi.resolve(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action échouée');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Alertes"
        description="Suivi des points critiques sur la flotte et la facturation"
        actions={
          canManage && (
            <Button variant="secondary" onClick={resync} loading={busy}>
              <RefreshCw className="h-4 w-4" />
              Recalculer
            </Button>
          )
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Alertes ouvertes
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary?.open ?? '—'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Critiques
            </p>
            <p className="mt-1 text-2xl font-bold text-danger">
              {summary?.critical ?? '—'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total (toutes statuts)
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {summary?.total ?? '—'}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Statut" htmlFor="f-status">
            <Select
              id="f-status"
              value={status}
              onChange={(e) => setStatus(e.currentTarget.value as AlertStatusName | '')}
            >
              <option value="">Tous</option>
              <option value="OPEN">Ouvertes</option>
              <option value="ACKNOWLEDGED">Acquittées</option>
              <option value="RESOLVED">Résolues</option>
            </Select>
          </Field>
          <Field label="Sévérité" htmlFor="f-severity">
            <Select
              id="f-severity"
              value={severity}
              onChange={(e) => setSeverity(e.currentTarget.value as AlertSeverityName | '')}
            >
              <option value="">Toutes</option>
              <option value="CRITICAL">Critique</option>
              <option value="WARNING">Attention</option>
              <option value="INFO">Info</option>
            </Select>
          </Field>
        </CardBody>
      </Card>

      <div className="space-y-3">
        {alerts === null ? (
          <Card>
            <CardBody className="text-center text-slate-400 py-8">Chargement…</CardBody>
          </Card>
        ) : alerts.length === 0 ? (
          <Card>
            <CardBody className="text-center text-slate-400 py-8">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
              Aucune alerte correspondant à ces filtres.
            </CardBody>
          </Card>
        ) : (
          alerts.map((a) => (
            <Card key={a.id}>
              <CardBody className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`mt-0.5 p-2 rounded-lg ${
                      a.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-600'
                        : a.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                      <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>
                      <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {a.dueAt ? `Échéance : ${formatDate(a.dueAt)} · ` : ''}
                      Créée le {formatDate(a.createdAt)}
                    </p>
                  </div>
                </div>
                {canManage && a.status !== 'RESOLVED' && (
                  <div className="flex items-center gap-2 shrink-0">
                    {a.status === 'OPEN' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => act(a.id, 'acknowledge')}
                        disabled={busy}
                      >
                        Acquitter
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => act(a.id, 'resolve')}
                      disabled={busy}
                    >
                      <XCircle className="h-4 w-4" />
                      Résoudre
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <p className="text-xs text-slate-400">
        Les alertes sont recalculées automatiquement lors des modifications sur les
        véhicules, les factures et les crédits. Utilisez « Recalculer » pour un
        recalcul manuel (e.g. après un changement de date système).
        <br />
        <Link href="/vehicles" className="text-secondary hover:underline">
          Ouvrir les véhicules
        </Link>
      </p>
    </div>
  );
}
