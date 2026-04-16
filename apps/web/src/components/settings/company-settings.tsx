'use client';

import { Building2, ImagePlus, Save, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { tenantSelfApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';

const MAX_LOGO_BYTES = 512 * 1024; // 512 KB raw
const ACCEPTED = ['image/png', 'image/jpeg'];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier échouée'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

interface LegalFields {
  city: string;
  website: string;
  taxId: string;
  ice: string;
  rc: string;
  patente: string;
  cnss: string;
  bankName: string;
  bankRib: string;
}

export function CompanySettings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const tenant = user?.tenant;

  const [name, setName] = useState(tenant?.name ?? '');
  const [phone, setPhone] = useState(tenant?.phone ?? '');
  const [billingEmail, setBillingEmail] = useState(tenant?.billingEmail ?? '');
  const [address, setAddress] = useState(tenant?.address ?? '');
  const [legal, setLegal] = useState<LegalFields>(() => ({
    city: tenant?.city ?? '',
    website: tenant?.website ?? '',
    taxId: tenant?.taxId ?? '',
    ice: tenant?.ice ?? '',
    rc: tenant?.rc ?? '',
    patente: tenant?.patente ?? '',
    cnss: tenant?.cnss ?? '',
    bankName: tenant?.bankName ?? '',
    bankRib: tenant?.bankRib ?? '',
  }));
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logoUrl ?? null);
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const setLegalField = (k: keyof LegalFields, v: string) =>
    setLegal((prev) => ({ ...prev, [k]: v }));

  if (!tenant) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-500">
            Aucune entreprise rattachée à votre compte (super-administrateur).
          </p>
        </CardBody>
      </Card>
    );
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      toast.error('Format non supporté', 'Utilisez PNG ou JPEG.');
      return;
    }
    if (f.size > MAX_LOGO_BYTES) {
      toast.error(
        'Fichier trop volumineux',
        `Le logo doit faire au maximum ${Math.round(MAX_LOGO_BYTES / 1024)} Ko.`,
      );
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(f);
      setPendingLogo(dataUrl);
      setLogoPreview(dataUrl);
    } catch (err) {
      toast.error(
        'Impossible de lire le fichier',
        err instanceof Error ? err.message : 'Erreur inconnue',
      );
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      await tenantSelfApi.update({
        name: name.trim() || undefined,
        phone: phone.trim(),
        billingEmail: billingEmail.trim(),
        address: address.trim(),
        city: legal.city.trim(),
        website: legal.website.trim(),
        taxId: legal.taxId.trim(),
        ice: legal.ice.trim(),
        rc: legal.rc.trim(),
        patente: legal.patente.trim(),
        cnss: legal.cnss.trim(),
        bankName: legal.bankName.trim(),
        bankRib: legal.bankRib.trim(),
        ...(pendingLogo !== null ? { logoUrl: pendingLogo } : {}),
      });
      await refreshUser();
      setPendingLogo(null);
      toast.success(
        'Entreprise mise à jour',
        'Les changements sont visibles sur les documents émis.',
      );
    } catch (err) {
      toast.error(
        'Échec de la mise à jour',
        err instanceof ApiError ? err.message : 'Erreur inconnue',
      );
    } finally {
      setSaving(false);
    }
  }

  async function onRemoveLogo() {
    if (!isAdmin) return;
    setRemoving(true);
    try {
      await tenantSelfApi.update({ logoUrl: '' });
      await refreshUser();
      setLogoPreview(null);
      setPendingLogo(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Logo supprimé');
    } catch (err) {
      toast.error(
        'Suppression échouée',
        err instanceof ApiError ? err.message : 'Erreur inconnue',
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-primary-500" />
            Logo d'entreprise (documents imprimés)
          </CardTitle>
          <Badge tone="slate">PNG · JPEG · ≤ 512 Ko</Badge>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="shrink-0">
              <div
                className="h-28 w-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden"
                aria-label="Aperçu du logo"
              >
                {logoPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center px-2">
                    <Building2 className="h-7 w-7 mx-auto text-slate-300" />
                    <p className="mt-1 text-[10px] text-slate-400">Aucun logo</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <p className="text-sm text-slate-600">
                Ce logo apparaîtra en en-tête des contrats (PDF) et autres documents
                émis à vos clients. Dimensions recommandées :{' '}
                <strong>carré, 512×512 px</strong>, fond transparent (PNG).
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={onPickFile}
                disabled={!isAdmin}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={!isAdmin}
                >
                  <Upload className="h-4 w-4" />
                  {logoPreview ? 'Remplacer le logo' : 'Choisir un fichier'}
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={removing}
                    onClick={onRemoveLogo}
                    disabled={!isAdmin}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                )}
                {pendingLogo && (
                  <span className="inline-flex items-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Modifications non enregistrées
                  </span>
                )}
              </div>

              {!isAdmin && (
                <p className="text-xs text-slate-400">
                  Seul un administrateur peut modifier le branding de l'entreprise.
                </p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-500" />
            Informations de l'entreprise
          </CardTitle>
          <Badge tone="blue">{tenant.status}</Badge>
        </CardHeader>
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nom de l'entreprise" htmlFor="cName" required>
              <Input
                id="cName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!isAdmin}
                required
                maxLength={255}
              />
            </Field>
            <Field label="Téléphone" htmlFor="cPhone">
              <Input
                id="cPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={!isAdmin}
                maxLength={32}
                placeholder="+212 6 00 00 00 00"
              />
            </Field>
            <Field label="Email de facturation" htmlFor="cEmail">
              <Input
                id="cEmail"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                readOnly={!isAdmin}
                maxLength={255}
              />
            </Field>
            <Field label="Identifiant (slug)" htmlFor="cSlug">
              <Input
                id="cSlug"
                value={tenant.slug}
                readOnly
                className="bg-slate-50"
              />
            </Field>
            <Field label="Plan" htmlFor="cPlan">
              <Input
                id="cPlan"
                value={tenant.plan ?? '—'}
                readOnly
                className="bg-slate-50"
              />
            </Field>
            <Field label="Statut" htmlFor="cStatus">
              <Input
                id="cStatus"
                value={tenant.status}
                readOnly
                className="bg-slate-50"
              />
            </Field>
            <Field label="Adresse" htmlFor="cAddr">
              <Input
                id="cAddr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                readOnly={!isAdmin}
                maxLength={500}
                placeholder="12 avenue Hassan II"
              />
            </Field>
            <Field label="Ville" htmlFor="cCity">
              <Input
                id="cCity"
                value={legal.city}
                onChange={(e) => setLegalField('city', e.target.value)}
                readOnly={!isAdmin}
                maxLength={120}
                placeholder="Casablanca"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Site web" htmlFor="cWeb">
                <Input
                  id="cWeb"
                  type="url"
                  value={legal.website}
                  onChange={(e) => setLegalField('website', e.target.value)}
                  readOnly={!isAdmin}
                  maxLength={255}
                  placeholder="https://www.exemple.ma"
                />
              </Field>
            </div>
          </div>

          {!isAdmin && (
            <div className="rounded-lg bg-primary-50/60 border border-primary-100 p-3.5 text-xs text-primary-700">
              Seul un administrateur peut modifier les informations de l'entreprise.
            </div>
          )}
        </CardBody>
      </Card>

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
            Ces informations apparaîtront dans le pied de page des contrats, factures et
            autres documents imprimés. Remplissez ce que vous possédez ; les champs
            vides seront ignorés.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ICE (Identifiant Commun Entreprise)" htmlFor="cIce">
              <Input
                id="cIce"
                value={legal.ice}
                onChange={(e) => setLegalField('ice', e.target.value)}
                readOnly={!isAdmin}
                maxLength={32}
                placeholder="15 chiffres"
              />
            </Field>
            <Field label="RC (Registre de Commerce)" htmlFor="cRc">
              <Input
                id="cRc"
                value={legal.rc}
                onChange={(e) => setLegalField('rc', e.target.value)}
                readOnly={!isAdmin}
                maxLength={64}
                placeholder="N° / Ville"
              />
            </Field>
            <Field label="IF (Identifiant Fiscal)" htmlFor="cIf">
              <Input
                id="cIf"
                value={legal.taxId}
                onChange={(e) => setLegalField('taxId', e.target.value)}
                readOnly={!isAdmin}
                maxLength={64}
              />
            </Field>
            <Field label="Patente / Taxe professionnelle" htmlFor="cPat">
              <Input
                id="cPat"
                value={legal.patente}
                onChange={(e) => setLegalField('patente', e.target.value)}
                readOnly={!isAdmin}
                maxLength={64}
              />
            </Field>
            <Field label="CNSS" htmlFor="cCnss">
              <Input
                id="cCnss"
                value={legal.cnss}
                onChange={(e) => setLegalField('cnss', e.target.value)}
                readOnly={!isAdmin}
                maxLength={64}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-500" />
            Coordonnées bancaires
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-xs text-slate-500 mb-4">
            Optionnel — affichés en pied de document pour faciliter les paiements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
            <Field label="Banque" htmlFor="cBank">
              <Input
                id="cBank"
                value={legal.bankName}
                onChange={(e) => setLegalField('bankName', e.target.value)}
                readOnly={!isAdmin}
                maxLength={120}
                placeholder="Ex : Attijariwafa Bank"
              />
            </Field>
            <Field label="RIB" htmlFor="cRib">
              <Input
                id="cRib"
                value={legal.bankRib}
                onChange={(e) => setLegalField('bankRib', e.target.value)}
                readOnly={!isAdmin}
                maxLength={64}
                placeholder="24 chiffres"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      {isAdmin && (
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 pb-2 flex justify-end gap-2">
          <Button type="submit" loading={saving} size="lg">
            <Save className="h-4 w-4" />
            Enregistrer les modifications
          </Button>
        </div>
      )}
    </form>
  );
}
