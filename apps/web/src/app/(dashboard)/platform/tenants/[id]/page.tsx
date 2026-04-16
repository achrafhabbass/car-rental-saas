'use client';

import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarPlus,
  CheckCircle2,
  ImagePlus,
  LogIn,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

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

const MAX_LOGO = 512 * 1024;

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

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture échouée'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function PlatformTenantDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [tenant, setTenant] = useState<TenantSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Editable fields
  const [plan, setPlan] = useState<TenantPlanName | ''>('');
  const [billingEmail, setBillingEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');
  const [ice, setIce] = useState('');
  const [rc, setRc] = useState('');
  const [taxId, setTaxId] = useState('');
  const [patente, setPatente] = useState('');
  const [cnss, setCnss] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankRib, setBankRib] = useState('');
  const [subEnd, setSubEnd] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);

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
        setCity(t.city ?? '');
        setWebsite(t.website ?? '');
        setIce(t.ice ?? '');
        setRc(t.rc ?? '');
        setTaxId(t.taxId ?? '');
        setPatente(t.patente ?? '');
        setCnss(t.cnss ?? '');
        setBankName(t.bankName ?? '');
        setBankRib(t.bankRib ?? '');
        setSubEnd(t.subscriptionEnd?.slice(0, 10) ?? '');
        setLogoPreview(t.logoUrl ?? null);
        setPendingLogo(null);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPickLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png', 'image/jpeg'].includes(f.type)) {
      toast.error('Format non supporté', 'PNG ou JPEG uniquement.');
      return;
    }
    if (f.size > MAX_LOGO) {
      toast.error('Fichier trop volumineux', `Max ${Math.round(MAX_LOGO / 1024)} Ko.`);
      return;
    }
    const url = await readAsDataUrl(f);
    setPendingLogo(url);
    setLogoPreview(url);
  }

  async function save() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await platformApi.updateTenant(id, {
        plan: (plan || undefined) as TenantPlanName | undefined,
        billingEmail: billingEmail || undefined,
        phone,
        address,
        city,
        website,
        ice,
        rc,
        taxId,
        patente,
        cnss,
        bankName,
        bankRib,
        subscriptionEnd: subEnd ? new Date(subEnd).toISOString() : undefined,
        ...(pendingLogo !== null ? { logoUrl: pendingLogo } : {}),
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

  async function removeLogo() {
    if (!id) return;
    setBusy(true);
    try {
      await platformApi.updateTenant(id, { logoUrl: '' });
      setLogoPreview(null);
      setPendingLogo(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Logo supprimé');
      load();
    } catch (err) {
      toast.error('Échec', err instanceof ApiError ? err.message : 'Erreur');
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
      toast.error('Activation échouée', err instanceof ApiError ? err.message : 'Échec');
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
      toast.info('Tenant suspendu');
      load();
    } catch (err) {
      toast.error('Suspension échouée', err instanceof ApiError ? err.message : 'Échec');
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
      toast.error('Résiliation échouée', err instanceof ApiError ? err.message : 'Échec');
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
      toast.error('Prolongation échouée', err instanceof ApiError ? err.message : 'Échec');
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
        newEndDate: extendNewDate ? new Date(extendNewDate).toISOString() : undefined,
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
      toast.error('Prolongation échouée', err instanceof ApiError ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  }

  async function deleteTenant() {
    if (!id) return;
    setBusy(true);
    try {
      await platformApi.softDelete(id);
      toast.success('Tenant supprimé');
      router.push('/platform/tenants');
      router.refresh();
    } catch (err) {
      toast.error('Suppression échouée', err instanceof ApiError ? err.message : 'Échec');
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
      toast.info('Impersonation activée', `Connecté en tant que ${result.user.firstName} ${result.user.lastName}`);
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error('Impersonation échouée', err instanceof ApiError ? err.message : 'Échec');
      setBusy(false);
    }
  }

  if (!tenant) {
    return (
      <div className="max-w-container text-sm text-slate-400">
        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">{error}</div>
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

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs', value: fmt(tenant.userCount) },
          { label: 'Véhicules', value: fmt(tenant.vehicleCount) },
          { label: 'Contrats actifs', value: fmt(tenant.activeContractCount) },
          { label: 'Impayés', value: fmtMoney(tenant.outstandingBalance) },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardBody>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{kpi.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-primary-500" />
            Logo d'entreprise
          </CardTitle>
          <Badge tone="slate">PNG · JPEG · ≤ 512 Ko</Badge>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-7 w-7 text-slate-300" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <p className="text-sm text-slate-600">
                Ce logo apparaît sur les contrats PDF et documents du tenant.
              </p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onPickLogo} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  {logoPreview ? 'Remplacer' : 'Choisir'}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="danger" size="sm" onClick={removeLogo} loading={busy}>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                )}
                {pendingLogo && (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Non enregistré — cliquez Enregistrer
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Identité & abonnement */}
      <Card>
        <CardHeader>
          <CardTitle>Identité & abonnement</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Plan" htmlFor="plan">
            <Select id="plan" value={plan} onChange={(e) => { const v = e.target.value; setPlan(v as TenantPlanName); }}>
              <option value="STARTER">Starter</option>
              <option value="BUSINESS">Business</option>
              <option value="ENTERPRISE">Enterprise</option>
            </Select>
          </Field>
          <Field label="Email de facturation" htmlFor="billing">
            <Input id="billing" type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Adresse" htmlFor="address">
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 avenue Hassan II" />
          </Field>
          <Field label="Ville" htmlFor="city">
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Casablanca" />
          </Field>
          <Field label="Site web" htmlFor="website">
            <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Fin d'abonnement" htmlFor="sub-end">
            <Input id="sub-end" type="date" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      {/* Identifiants légaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-500" />
            Identifiants légaux & fiscaux
          </CardTitle>
          <Badge tone="slate">Affichés sur les documents</Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-xs text-slate-500">
            Ces informations apparaîtront sur les contrats, factures et documents du tenant.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="ICE" htmlFor="ice">
              <Input id="ice" value={ice} onChange={(e) => setIce(e.target.value)} placeholder="15 chiffres" maxLength={32} />
            </Field>
            <Field label="RC (Registre de Commerce)" htmlFor="rc">
              <Input id="rc" value={rc} onChange={(e) => setRc(e.target.value)} maxLength={64} />
            </Field>
            <Field label="IF (Identifiant Fiscal)" htmlFor="taxId">
              <Input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} maxLength={64} />
            </Field>
            <Field label="Patente" htmlFor="patente">
              <Input id="patente" value={patente} onChange={(e) => setPatente(e.target.value)} maxLength={64} />
            </Field>
            <Field label="CNSS" htmlFor="cnss">
              <Input id="cnss" value={cnss} onChange={(e) => setCnss(e.target.value)} maxLength={64} />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Coordonnées bancaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-500" />
            Coordonnées bancaires
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
            <Field label="Banque" htmlFor="bankName">
              <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Attijariwafa Bank" maxLength={120} />
            </Field>
            <Field label="RIB" htmlFor="bankRib">
              <Input id="bankRib" value={bankRib} onChange={(e) => setBankRib(e.target.value)} placeholder="24 chiffres" maxLength={64} />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Save button */}
      <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 pb-2 flex justify-end">
        <Button onClick={save} loading={busy} size="lg">
          <Save className="h-4 w-4" />
          Enregistrer les modifications
        </Button>
      </div>

      {/* Cycle de vie */}
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
            <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy}>
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
                  onChange={(e) => setTrialDays(Number(e.target.value) || 0)}
                />
              </Field>
              <Button variant="secondary" onClick={extendTrial} disabled={busy || trialDays < 1}>
                <CalendarPlus className="h-4 w-4" />
                Prolonger
              </Button>
            </div>
          )}

          {canExtendSubscription && (
            <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
              <p className="text-sm font-semibold text-slate-900">Prolonger l'abonnement</p>
              <p className="text-xs text-slate-500">
                Ajouter N jours ou définir une date absolue. Si expiré/suspendu, le tenant sera réactivé.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <Field label="Ajouter N jours" htmlFor="ext-days">
                  <Input
                    id="ext-days"
                    type="number"
                    min={1}
                    max={3650}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value) || 0)}
                    disabled={!!extendNewDate}
                  />
                </Field>
                <Field label="OU date absolue" htmlFor="ext-date">
                  <Input id="ext-date" type="date" value={extendNewDate} onChange={(e) => setExtendNewDate(e.target.value)} />
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
              <strong>{tenant.name}</strong> sera marqué comme résilié et ses utilisateurs
              perdront l'accès.
            </p>
            <Field label="Motif (optionnel)" htmlFor="cancel-reason">
              <Input id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </Field>
          </div>
        }
        tone="danger"
        confirmLabel="Oui, résilier"
        cancelLabel="Annuler"
        loading={busy}
        onConfirm={cancel}
        onCancel={() => { setConfirmCancel(false); setCancelReason(''); }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer définitivement ce tenant ?"
        description={
          <span>
            <strong>{tenant.name}</strong> sera retiré. Les données restent archivées pour audit.
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
