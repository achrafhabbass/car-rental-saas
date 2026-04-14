'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { clientsApi, contractsApi, vehiclesApi } from '@/lib/resources';
import type { ClientDto, VehicleDto } from '@autosphere/shared';

export default function NewContractPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      vehiclesApi.list({ pageSize: 200, status: 'AVAILABLE' }),
      clientsApi.list({ pageSize: 200, blacklisted: false }),
    ])
      .then(([v, c]) => {
        setVehicles(v.items);
        setClients(c.items);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await contractsApi.create({
        vehicleId: String(fd.get('vehicleId')),
        clientId: String(fd.get('clientId')),
        startDate: new Date(String(fd.get('startDate'))).toISOString(),
        endDate: new Date(String(fd.get('endDate'))).toISOString(),
        kmStart: Number(fd.get('kmStart')),
        kmAllowance: fd.get('kmAllowance') ? Number(fd.get('kmAllowance')) : undefined,
        dailyRate: fd.get('dailyRate') ? Number(fd.get('dailyRate')) : undefined,
        depositAmount: fd.get('depositAmount') ? Number(fd.get('depositAmount')) : undefined,
        depositMethod: (String(fd.get('depositMethod')) as 'CASH' | 'CHECK' | 'CARD' | 'CARD_IMPRINT' | 'BANK_TRANSFER') || undefined,
        depositReference: String(fd.get('depositReference') || '') || undefined,
        discountAmount: fd.get('discountAmount') ? Number(fd.get('discountAmount')) : undefined,
        pickupLocation: String(fd.get('pickupLocation') || '') || undefined,
        returnLocation: String(fd.get('returnLocation') || '') || undefined,
        additionalDriver: String(fd.get('additionalDriver') || '') || undefined,
        additionalDriverLicense: String(fd.get('additionalDriverLicense') || '') || undefined,
        notes: String(fd.get('notes') || '') || undefined,
      });
      router.push('/contracts');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Nouveau contrat" description="Créer un contrat de location" />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Véhicule" htmlFor="vehicleId" required>
              <Select id="vehicleId" name="vehicleId" required>
                <option value="">— Sélectionner —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration} · {v.brand} {v.model}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Client" htmlFor="clientId" required>
              <Select id="clientId" name="clientId" required>
                <option value="">— Sélectionner —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} · {c.idNumber}
                  </option>
                ))}
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Période & kilométrage</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Début" htmlFor="startDate" required>
              <Input id="startDate" name="startDate" type="datetime-local" required />
            </Field>
            <Field label="Fin" htmlFor="endDate" required>
              <Input id="endDate" name="endDate" type="datetime-local" required />
            </Field>
            <Field label="Km au départ" htmlFor="kmStart" required>
              <Input id="kmStart" name="kmStart" type="number" min={0} required />
            </Field>
            <Field label="Km inclus/jour (vide = illimité)" htmlFor="kmAllowance">
              <Input id="kmAllowance" name="kmAllowance" type="number" min={0} />
            </Field>
            <Field label="Lieu de prise" htmlFor="pickupLocation">
              <Input id="pickupLocation" name="pickupLocation" />
            </Field>
            <Field label="Lieu de retour" htmlFor="returnLocation">
              <Input id="returnLocation" name="returnLocation" />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Tarification & caution</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Tarif/jour (MAD)" htmlFor="dailyRate" hint="Laisser vide pour utiliser le tarif véhicule">
              <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min={0} />
            </Field>
            <Field label="Remise (MAD)" htmlFor="discountAmount">
              <Input id="discountAmount" name="discountAmount" type="number" step="0.01" min={0} defaultValue={0} />
            </Field>
            <Field label="Caution (MAD)" htmlFor="depositAmount">
              <Input id="depositAmount" name="depositAmount" type="number" step="0.01" min={0} defaultValue={0} />
            </Field>
            <Field label="Mode de caution" htmlFor="depositMethod">
              <Select id="depositMethod" name="depositMethod" defaultValue="">
                <option value="">—</option>
                <option value="CASH">Espèces</option>
                <option value="CHECK">Chèque</option>
                <option value="CARD">Carte bancaire</option>
                <option value="CARD_IMPRINT">Empreinte CB</option>
                <option value="BANK_TRANSFER">Virement</option>
              </Select>
            </Field>
            <Field label="Référence caution" htmlFor="depositReference">
              <Input id="depositReference" name="depositReference" />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Conducteur additionnel</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nom" htmlFor="additionalDriver">
              <Input id="additionalDriver" name="additionalDriver" />
            </Field>
            <Field label="N° permis" htmlFor="additionalDriverLicense">
              <Input id="additionalDriverLicense" name="additionalDriverLicense" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes" htmlFor="notes">
                <Textarea id="notes" name="notes" rows={3} />
              </Field>
            </div>
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
            Créer le contrat
          </Button>
        </div>
      </form>
    </div>
  );
}
