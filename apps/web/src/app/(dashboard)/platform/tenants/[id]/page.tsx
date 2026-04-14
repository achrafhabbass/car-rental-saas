'use client';

import { ArrowLeft, Ban, CalendarPlus, CheckCircle2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { platformApi } from '@/lib/resources';
import type { TenantPlanName, TenantSummaryDto } from '@autosphere/shared';

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function fmtMoney(n: number): string {
  return `${fmt(n)} MAD`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PlatformTenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<TenantPlanName | ''>('');
  const [billingEmail, setBillingEmail] = useState('');
  const [subEnd, setSubEnd] = useState('');
  const [trialDays, setTrialDays] = useState(7);

  const load = useCallback(() => {
    if (!id) return;
    platformApi
      .getTenant(id)
      .then((t) => {
        setTenant(t);
        setPlan(t.plan);
        setBillingEmail(t.billingEmail ?? '');
        setSubEnd(t.subscriptionEnd?.slice(0, 10) ?? '');
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await platformApi.updateTenant(id, {
        plan: (plan || undefined) as TenantPlanName | undefined,
        billingEmail: billingEmail || undefined,
        subscriptionEnd: subEnd
          ? new Date(subEnd).toISOString()
          : undefined,
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour échouée');
    } finally {
      setBusy(false);
    }
  }

  async function transition(
    action: 'suspend' | 'activate' | 'cancel' | 'extend',
  ) {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      if (action === 'suspend') {
        const reason = prompt('Motif de la suspension (optionnel)') ?? undefined;
        await platformApi.suspend(id, reason || undefined);
      } else if (action === 'cancel') {
        const reason = prompt('Motif de la résiliation (optionnel)') ?? undefined;
        await platformApi.cancel(id, reason || undefined);
      } else if (action === 'activate') {
        await platformApi.activate(id);
      } else {
        await platformApi.extendTrial(id, trialDays);
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action échouée');
    } finally {
      setBusy(false);
    }
  }

  if (!tenant) {
    return (
      <div className="max-w-container text-sm text-slate-400">
        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
            {error}
          </div>
        ) : (
          'Chargement…'
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-container">
      <Link
        href="/platform/tenants"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3 w-3" />
        Tous les tenants
      </Link>

      <PageHeader
        title={tenant.name}
        description={`${tenant.slug} · créé le ${formatDate(tenant.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="blue">{tenant.plan}</Badge>
            <Badge
              tone={
                tenant.status === 'ACTIVE'
                  ? 'green'
                  : tenant.status === 'TRIAL'
                    ? 'blue'
                    : tenant.status === 'SUSPENDED'
                      ? 'amber'
                      : tenant.status === 'EXPIRED'
                        ? 'red'
                        : 'slate'
              }
            >
              {tenant.status}
            </Badge>
          </div>
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
              Utilisateurs
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {fmt(tenant.userCount)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Véhicules
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {fmt(tenant.vehicleCount)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Contrats actifs
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {fmt(tenant.activeContractCount)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Impayés
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {fmtMoney(tenant.outstandingBalance)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Plan" htmlFor="plan">
            <Select
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.currentTarget.value as TenantPlanName)}
            >
              <option value="STARTER">Starter</option>
              <option value="BUSINESS">Business</option>
              <option value="ENTERPRISE">Enterprise</option>
            </Select>
          </Field>
          <Field label="Email de facturation" htmlFor="billing">
            <Input
              id="billing"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.currentTarget.value)}
            />
          </Field>
          <Field label="Fin d'abonnement" htmlFor="sub-end">
            <Input
              id="sub-end"
              type="date"
              value={subEnd}
              onChange={(e) => setSubEnd(e.currentTarget.value)}
            />
          </Field>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={save} loading={busy}>
              Enregistrer
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cycle de vie</CardTitle>
          <span className="text-xs text-slate-500">
            Fin d'essai : {formatDate(tenant.trialEndsAt)}
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tenant.status !== 'ACTIVE' && (
              <Button onClick={() => transition('activate')} disabled={busy}>
                <CheckCircle2 className="h-4 w-4" />
                Activer
              </Button>
            )}
            {(tenant.status === 'ACTIVE' || tenant.status === 'TRIAL') && (
              <Button
                variant="secondary"
                onClick={() => transition('suspend')}
                disabled={busy}
              >
                <Ban className="h-4 w-4" />
                Suspendre
              </Button>
            )}
            {tenant.status !== 'CANCELLED' && (
              <Button
                variant="danger"
                onClick={() => transition('cancel')}
                disabled={busy}
              >
                <RotateCcw className="h-4 w-4" />
                Résilier
              </Button>
            )}
          </div>

          {tenant.status === 'TRIAL' && (
            <div className="flex items-end gap-3">
              <Field label="Prolonger l'essai de (jours)" htmlFor="trial-days">
                <Input
                  id="trial-days"
                  type="number"
                  min={1}
                  max={365}
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.currentTarget.value) || 0)}
                />
              </Field>
              <Button
                variant="secondary"
                onClick={() => transition('extend')}
                disabled={busy || trialDays < 1}
              >
                <CalendarPlus className="h-4 w-4" />
                Prolonger
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
