'use client';

import { ArrowLeft, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { clientsApi } from '@/lib/resources';
import type { ClientDto } from '@autosphere/shared';

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'MANAGER', 'EMPLOYEE');
  const canDelete = hasRole('ADMIN', 'MANAGER');

  const [client, setClient] = useState<ClientDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    clientsApi
      .get(id)
      .then(setClient)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await clientsApi.update(id, {
        type: (String(fd.get('type')) as 'INDIVIDUAL' | 'COMPANY') || undefined,
        fullName: String(fd.get('fullName')),
        companyName: String(fd.get('companyName') || '') || undefined,
        idNumber: String(fd.get('idNumber')),
        idType: String(fd.get('idType') || '') || undefined,
        licenseNumber: String(fd.get('licenseNumber') || '') || undefined,
        licenseExpiry: String(fd.get('licenseExpiry') || '') || undefined,
        phone: String(fd.get('phone') || '') || undefined,
        email: String(fd.get('email') || '') || undefined,
        addressLine1: String(fd.get('addressLine1') || '') || undefined,
        city: String(fd.get('city') || '') || undefined,
        country: String(fd.get('country') || '') || undefined,
        segment: (String(fd.get('segment')) as 'VIP' | 'REGULAR' | 'OCCASIONAL' | 'AT_RISK') || undefined,
        notes: String(fd.get('notes') || '') || undefined,
      });
      setClient(updated);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour échouée');
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlacklist() {
    if (!id || !client) return;
    setError(null);
    const action = client.blacklisted ? 'réactiver' : 'blacklister';
    if (!confirm(`Confirmer : ${action} ce client ?`)) return;
    const reason = client.blacklisted
      ? undefined
      : (prompt('Motif (optionnel)') ?? undefined);
    try {
      const updated = await clientsApi.update(id, {
        blacklisted: !client.blacklisted,
        blacklistReason: client.blacklisted ? undefined : reason,
      });
      setClient(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec');
    }
  }

  async function onDelete() {
    if (!id) return;
    if (!confirm('Supprimer ce client ? (soft delete)')) return;
    setDeleting(true);
    try {
      await clientsApi.delete(id);
      router.push('/clients');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression échouée');
      setDeleting(false);
    }
  }

  if (!client) {
    return (
      <div className="max-w-3xl text-sm text-slate-400">
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
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3 w-3" />
        Tous les clients
      </Link>

      <PageHeader
        title={client.fullName}
        description={`${client.type === 'COMPANY' ? 'Entreprise' : 'Particulier'} · ${client.idNumber}`}
        actions={
          <div className="flex items-center gap-2">
            {client.blacklisted && <Badge tone="red">Blacklisté</Badge>}
            {canDelete && (
              <>
                <Button
                  type="button"
                  variant={client.blacklisted ? 'secondary' : 'danger'}
                  onClick={toggleBlacklist}
                >
                  {client.blacklisted ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Réactiver
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4" />
                      Blacklister
                    </>
                  )}
                </Button>
                <Button variant="danger" onClick={onDelete} loading={deleting}>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </>
            )}
          </div>
        }
      />

      {!canEdit && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Lecture seule.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <fieldset disabled={!canEdit}>
          <Card>
            <CardHeader>
              <CardTitle>Identité</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Type" htmlFor="type">
                <Select id="type" name="type" defaultValue={client.type}>
                  <option value="INDIVIDUAL">Particulier</option>
                  <option value="COMPANY">Entreprise</option>
                </Select>
              </Field>
              <Field label="Segment" htmlFor="segment">
                <Select id="segment" name="segment" defaultValue={client.segment}>
                  <option value="VIP">VIP</option>
                  <option value="REGULAR">Régulier</option>
                  <option value="OCCASIONAL">Occasionnel</option>
                  <option value="AT_RISK">À risque</option>
                </Select>
              </Field>
              <Field label="Nom complet / raison sociale" htmlFor="fullName" required>
                <Input id="fullName" name="fullName" defaultValue={client.fullName} required />
              </Field>
              <Field label="Nom commercial" htmlFor="companyName">
                <Input id="companyName" name="companyName" defaultValue={client.companyName ?? ''} />
              </Field>
              <Field label="N° pièce d'identité" htmlFor="idNumber" required>
                <Input id="idNumber" name="idNumber" defaultValue={client.idNumber} required />
              </Field>
              <Field label="Type de pièce" htmlFor="idType">
                <Select id="idType" name="idType" defaultValue={client.idType ?? 'CIN'}>
                  <option value="CIN">CIN</option>
                  <option value="PASSPORT">Passeport</option>
                  <option value="RC">Registre de commerce</option>
                  <option value="OTHER">Autre</option>
                </Select>
              </Field>
              <Field label="N° permis de conduire" htmlFor="licenseNumber">
                <Input id="licenseNumber" name="licenseNumber" defaultValue={client.licenseNumber ?? ''} />
              </Field>
              <Field label="Expiration permis" htmlFor="licenseExpiry">
                <Input
                  id="licenseExpiry"
                  name="licenseExpiry"
                  type="date"
                  defaultValue={toDateInput(client.licenseExpiry)}
                />
              </Field>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Téléphone" htmlFor="phone">
                <Input id="phone" name="phone" type="tel" defaultValue={client.phone ?? ''} />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input id="email" name="email" type="email" defaultValue={client.email ?? ''} />
              </Field>
              <Field label="Adresse" htmlFor="addressLine1">
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  defaultValue={client.addressLine1 ?? ''}
                />
              </Field>
              <Field label="Ville" htmlFor="city">
                <Input id="city" name="city" defaultValue={client.city ?? ''} />
              </Field>
              <Field label="Pays" htmlFor="country">
                <Input id="country" name="country" defaultValue={client.country ?? 'Maroc'} />
              </Field>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardBody>
              <Field label="Notes internes" htmlFor="notes">
                <Textarea id="notes" name="notes" rows={3} defaultValue={client.notes ?? ''} />
              </Field>
            </CardBody>
          </Card>
        </fieldset>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <Link href="/clients">
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button type="submit" loading={loading}>Enregistrer les modifications</Button>
          </div>
        )}
      </form>
    </div>
  );
}
