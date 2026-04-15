'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { clientsApi, reservationsApi, vehiclesApi } from '@/lib/resources';
import type { ClientDto, VehicleDto } from '@autosphere/shared';

export default function NewReservationPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      vehiclesApi.list({ pageSize: 200, status: 'AVAILABLE' }),
      clientsApi.list({ pageSize: 200 }),
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
      await reservationsApi.create({
        vehicleId: String(fd.get('vehicleId')),
        clientId: String(fd.get('clientId')),
        startDate: new Date(String(fd.get('startDate'))).toISOString(),
        endDate: new Date(String(fd.get('endDate'))).toISOString(),
        pickupLocation: String(fd.get('pickupLocation') || '') || undefined,
        returnLocation: String(fd.get('returnLocation') || '') || undefined,
        dailyRate: fd.get('dailyRate') ? Number(fd.get('dailyRate')) : undefined,
        source: (String(fd.get('source')) as 'DIRECT' | 'WEBSITE' | 'PHONE' | 'PARTNER' | 'WALK_IN') || undefined,
        paymentStatus:
          (String(fd.get('paymentStatus')) as 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED') || undefined,
        notes: String(fd.get('notes') || '') || undefined,
      });
      router.push('/reservations');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Nouvelle réservation" description="Créer une réservation" />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Véhicule" htmlFor="vehicleId" required>
              <Select id="vehicleId" name="vehicleId" required>
                <option value="">— Sélectionner un véhicule —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration} · {v.brand} {v.model}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Client" htmlFor="clientId" required>
              <Select id="clientId" name="clientId" required>
                <option value="">— Sélectionner un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} · {c.idNumber}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date de début" htmlFor="startDate" required>
              <Input id="startDate" name="startDate" type="datetime-local" required />
            </Field>
            <Field label="Date de fin" htmlFor="endDate" required>
              <Input id="endDate" name="endDate" type="datetime-local" required />
            </Field>
            <Field label="Lieu de prise en charge" htmlFor="pickupLocation">
              <Input id="pickupLocation" name="pickupLocation" />
            </Field>
            <Field label="Lieu de retour" htmlFor="returnLocation">
              <Input id="returnLocation" name="returnLocation" />
            </Field>
            <Field label="Tarif/jour (MAD) — laisser vide pour utiliser le tarif du véhicule" htmlFor="dailyRate">
              <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min={0} />
            </Field>
            <Field label="Source" htmlFor="source">
              <Select id="source" name="source" defaultValue="DIRECT">
                <option value="DIRECT">Direct</option>
                <option value="WEBSITE">Site web</option>
                <option value="PHONE">Téléphone</option>
                <option value="PARTNER">Partenaire</option>
                <option value="WALK_IN">Comptoir</option>
              </Select>
            </Field>
            <Field label="Statut de paiement" htmlFor="paymentStatus">
              <Select id="paymentStatus" name="paymentStatus" defaultValue="PENDING">
                <option value="PENDING">En attente</option>
                <option value="PARTIAL">Partiel</option>
                <option value="PAID">Payé</option>
                <option value="REFUNDED">Remboursé</option>
              </Select>
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
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
