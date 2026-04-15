'use client';

import {
  ArrowLeft,
  Ban,
  CalendarPlus,
  CheckCircle2,
  LogIn,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { enterImpersonation } from '@/lib/impersonation';
import { platformApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';
import type {
  TenantPlanName,
  TenantStatusName,
  TenantSummaryDto,
} from '@autosphere/shared';

const STATUS_TONE: Record<TenantStatusName, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  ACTIVE: 'green',
  TRIAL: 'blue',
  SUSPENDED: 'amber',
  EXPIRED: 'red',
  CANCELLED: 'slate',
};

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
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [tenant, setTenant] = useState<TenantSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Editable fields (Identity & subscription card)
  const [plan, setPlan] = useState<TenantPlanName | ''>('');
  const [billingEmail, setBillingEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [subEnd, setSubEnd] = useState('');

  // Lifecycle inputs
  const [trialDays, setTrialDays] = useState(7);
  const [extendDays, setExtendDays] = useState(30);
  const [extendNewDate, setExtendNewDate] = useState('');

  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    platformApi
      .getTenant(id)
      .then((t) => {
        setTenant(t);
        setPlan(t.plan);
        setBillingEmail(t.billingEmail ?? '');
        setPhone(t.phone ?? '');
        setAddress(t.address ?? '');
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
        phone: phone || undefined,
        address: address || undefined,
        subscriptionEnd: subEnd ? new Date(subEnd).toISOString() : undefined,
      });
      toast.success('Tenant mis à jour');
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Mise à jour échouée';
      setError(msg);
      toast.error('Mise à jour échouée', msg);
    } finally {
      setBusy(false);
    }
  }

  async function activate() {
    if (!id) return;
    setBusy(true);
    try {
      await platformApi.activate(id);
      toast.success('Tenant activé');
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Activation échouée', msg);
    } finally {
      setBusy(false);
    }
  }

  async function suspend() {
    if (!id) return;
    const reason = prompt('Motif de la suspension (optionnel)') ?? undefined;
    setBusy(true);
    try {
      await platformApi.suspend(id, reason || undefined);
      toast.info('Tenant suspendu', "Les utilisateurs ne pourront plus se connecter");
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Suspension échouée', msg);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!id) return;
    setBusy(true);
    try {
      await platformApi.cancel(id, cancelReason || undefined);
      toast.info('Tenant résilié');
      setConfirmCancel(false);
      setCancelReason('');
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Résiliation échouée', msg);
    } finally {
      setBusy(false);
    }
  }

  async function extendTrial() {
    if (!id) return;
    setBusy(true);
    try {
      await platformApi.extendTrial(id, trialDays);
      toast.success(`Essai prolongé de ${trialDays} jour(s)`);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Prolongation échouée', msg);
    } finally {
      setBusy(false);
    }
  }

  async function extendSubscription() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await platformApi.extendSubscription(id, {
        days: extendNewDate ? undefined : extendDays,
        newEndDate: extendNewDate
          ? new Date(extendNewDate).toISOString()
          : undefined,
      });
      toast.success(
        'Abonnement prolongé',
        extendNewDate
          ? `Nouvelle échéance : ${formatDate(extendNewDate)}`
          : `+${extendDays} jour(s)`,
      );
      setExtendNewDate('');
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Prolongation échouée', msg);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTenant() {
    if (!id) return;
    setBusy(true);
    try {
      await platformApi.softDelete(id);
      toast.success('Tenant supprimé', 'Toutes les données restent archivées');
      router.push('/platform/tenants');
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Suppression échouée', msg);
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function impersonate() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const result = await platformApi.impersonate(id);
      enterImpersonation(result);
      toast.info(
        'Impersonation activée',
        `Connecté en tant que ${result.user.firstName} ${result.user.lastName}`,
      );
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Impersonation échouée', msg);
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

  const canExtendSubscription =
    tenant.status === 'ACTIVE' || tenant.status === 'EXPIRED' || tenant.status === 'SUSPENDED';

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
            <Badge tone={STATUS_TONE[tenant.status] ?? 'slate'}>{tenant.status}</Badge>
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
            <p className="mt-2 text-xl font-bold text-slate-900">{fmt(tenant.userCount)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Véhicules</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{fmt(tenant.vehicleCount)}</p>
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Impayés</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {fmtMoney(tenant.outstandingBalance)}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identité & abonnement</CardTitle>
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
          <Field label="Téléphone" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Adresse" htmlFor="address">
              <Textarea
                id="address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
              />
            </Field>
          </div>
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
            Essai : {formatDate(tenant.trialEndsAt)} · Abo : {formatDate(tenant.subscriptionEnd)}
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tenant.status !== 'ACTIVE' && (
              <Button onClick={activate} disabled={busy}>
                <CheckCircle2 className="h-4 w-4" />
                Activer
              </Button>
            )}
            {(tenant.status === 'ACTIVE' || tenant.status === 'TRIAL') && (
              <Button variant="secondary" onClick={suspend} disabled={busy}>
                <Ban className="h-4 w-4" />
                Suspendre
              </Button>
            )}
            {tenant.status !== 'CANCELLED' && (
              <Button variant="danger" onClick={() => setConfirmCancel(true)} disabled={busy}>
                <RotateCcw className="h-4 w-4" />
                Résilier
              </Button>
            )}
            {tenant.status !== 'CANCELLED' && (
              <Button variant="secondary" onClick={impersonate} disabled={busy}>
                <LogIn className="h-4 w-4" />
                Login as company
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer définitivement
            </Button>
          </div>

          {tenant.status === 'TRIAL' && (
            <div className="flex items-end gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
              <Field label="Prolonger l'essai (jours)" htmlFor="trial-days">
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
                onClick={extendTrial}
                disabled={busy || trialDays < 1}
              >
                <CalendarPlus className="h-4 w-4" />
                Prolonger
              </Button>
            </div>
          )}

          {canExtendSubscription && (
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
              <p className="text-sm font-semibold text-slate-900">
                Prolonger l'abonnement
              </p>
              <p className="text-xs text-slate-500">
                Soit ajouter N jours à l'échéance actuelle, soit définir une date absolue.
                Si le tenant est expiré ou suspendu, il sera réactivé.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <Field label="Ajouter N jours" htmlFor="ext-days">
                  <Input
                    id="ext-days"
                    type="number"
                    min={1}
                    max={3650}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.currentTarget.value) || 0)}
                    disabled={!!extendNewDate}
                  />
                </Field>
                <Field label="OU date absolue" htmlFor="ext-date">
                  <Input
                    id="ext-date"
                    type="date"
                    value={extendNewDate}
                    onChange={(e) => setExtendNewDate(e.currentTarget.value)}
                  />
                </Field>
                <Button onClick={extendSubscription} loading={busy}>
                  <CalendarPlus className="h-4 w-4" />
                  Prolonger l'abonnement
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        title="Résilier le tenant ?"
        description={
          <div className="space-y-2">
            <p>
              <strong>{tenant.name}</strong> sera marqué comme résilié et tous ses utilisateurs
              perdront l'accès. Cette action peut être réactivée plus tard.
            </p>
            <Field label="Motif (optionnel)" htmlFor="cancel-reason">
              <Input
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.currentTarget.value)}
              />
            </Field>
          </div>
        }
        tone="danger"
        confirmLabel="Oui, résilier"
        cancelLabel="Annuler"
        loading={busy}
        onConfirm={cancel}
        onCancel={() => {
          setConfirmCancel(false);
          setCancelReason('');
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer définitivement ce tenant ?"
        description={
          <span>
            <strong>{tenant.name}</strong> sera retiré de la liste et plus aucun utilisateur ne
            pourra s'y connecter. Les données restent archivées en base pour audit.
          </span>
        }
        tone="danger"
        confirmLabel="Oui, supprimer"
        cancelLabel="Conserver"
        loading={busy}
        onConfirm={deleteTenant}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
