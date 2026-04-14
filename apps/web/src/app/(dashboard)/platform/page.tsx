'use client';

import { AlertTriangle, Building2, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { platformApi } from '@/lib/resources';
import type { PlatformMetricsDto } from '@autosphere/shared';

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

export default function PlatformDashboardPage() {
  const { hasRole } = useAuth();
  const [metrics, setMetrics] = useState<PlatformMetricsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);

  const load = () =>
    platformApi
      .metrics()
      .then(setMetrics)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );

  useEffect(() => {
    if (!hasRole('SUPER_ADMIN')) return;
    void load();
  }, [hasRole]);

  if (!hasRole('SUPER_ADMIN')) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <AlertTriangle className="h-10 w-10 mx-auto text-amber-400 mb-3" />
          <p className="text-sm text-slate-500">
            Cette section est réservée aux super-administrateurs.
          </p>
        </CardBody>
      </Card>
    );
  }

  async function sweep() {
    setSweeping(true);
    try {
      const r = await platformApi.sweepExpiries();
      await load();
      alert(`${r.expired} tenant(s) marqué(s) EXPIRED.`);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setSweeping(false);
    }
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Platform"
        description="Vue d'ensemble de tous les tenants AutoSphere"
        actions={
          <Button variant="secondary" onClick={sweep} loading={sweeping}>
            <Clock className="h-4 w-4" />
            Expirer les abonnements échus
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tenants actifs
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {metrics ? fmt(metrics.tenants.active) : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              sur {metrics ? fmt(metrics.tenants.total) : '—'} total
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              En essai
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {metrics ? fmt(metrics.tenants.trial) : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {metrics ? fmt(metrics.tenants.suspended) : '—'} suspendus
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              MRR (proxy)
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {metrics ? fmt(metrics.revenue.mrrApprox) : '—'} MAD
            </p>
            <p className="text-xs text-slate-400 mt-1">
              selon plans actifs + trial
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Expirent sous 7j
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {metrics ? fmt(metrics.expiring.days7) : '—'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {metrics ? fmt(metrics.expiring.days30) : '—'} sous 30j
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par plan</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {metrics ? (
              Object.entries(metrics.byPlan).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  Aucun tenant.
                </p>
              ) : (
                Object.entries(metrics.byPlan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between text-sm">
                    <Badge tone="blue">{plan}</Badge>
                    <span className="font-semibold text-slate-900">{fmt(count)}</span>
                  </div>
                ))
              )
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">Chargement…</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisation globale</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 flex-1">Utilisateurs</span>
              <span className="font-semibold">
                {metrics ? fmt(metrics.users.total) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 flex-1">Véhicules</span>
              <span className="font-semibold">
                {metrics ? fmt(metrics.fleet.total) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600 flex-1">Contrats actifs</span>
              <span className="font-semibold">
                {metrics ? fmt(metrics.contracts.active) : '—'}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="text-sm">
        <Link
          href="/platform/tenants"
          className="font-medium text-secondary hover:underline"
        >
          Gérer les tenants →
        </Link>
      </div>
    </div>
  );
}
