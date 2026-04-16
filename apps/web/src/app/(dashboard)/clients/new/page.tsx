'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { clientsApi } from '@/lib/resources';

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await clientsApi.create({
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
      router.push('/clients');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Nouveau client" description="Créer une fiche client" />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Type" htmlFor="type">
              <Select id="type" name="type" defaultValue="INDIVIDUAL">
                <option value="INDIVIDUAL">Particulier</option>
                <option value="COMPANY">Entreprise</option>
              </Select>
            </Field>
            <Field label="Segment" htmlFor="segment">
              <Select id="segment" name="segment" defaultValue="REGULAR">
                <option value="VIP">VIP</option>
                <option value="REGULAR">Régulier</option>
                <option value="OCCASIONAL">Occasionnel</option>
                <option value="AT_RISK">À risque</option>
              </Select>
            </Field>
            <Field label="Nom complet / Raison sociale" htmlFor="fullName" required>
              <Input id="fullName" name="fullName" required />
            </Field>
            <Field label="Nom commercial (entreprise)" htmlFor="companyName">
              <Input id="companyName" name="companyName" />
            </Field>
            <Field label="N° pièce d'identité" htmlFor="idNumber" required>
              <Input id="idNumber" name="idNumber" required />
            </Field>
            <Field label="Type de pièce" htmlFor="idType">
              <Select id="idType" name="idType" defaultValue="CIN">
                <option value="CIN">CIN</option>
                <option value="PASSPORT">Passeport</option>
                <option value="RC">Registre de commerce</option>
                <option value="OTHER">Autre</option>
              </Select>
            </Field>
            <Field label="N° permis de conduire" htmlFor="licenseNumber">
              <Input id="licenseNumber" name="licenseNumber" />
            </Field>
            <Field label="Expiration permis" htmlFor="licenseExpiry">
              <Input id="licenseExpiry" name="licenseExpiry" type="date" />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Téléphone" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" />
            </Field>
            <Field label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" />
            </Field>
            <Field label="Adresse" htmlFor="addressLine1">
              <Input id="addressLine1" name="addressLine1" />
            </Field>
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" />
            </Field>
            <Field label="Pays" htmlFor="country">
              <Input id="country" name="country" defaultValue="Maroc" />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <Field label="Notes internes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} />
            </Field>
          </CardBody>
        </Card>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
