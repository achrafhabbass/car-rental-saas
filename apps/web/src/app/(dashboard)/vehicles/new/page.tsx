'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { vehiclesApi } from '@/lib/resources';

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await vehiclesApi.create({
        registration: String(fd.get('registration')),
        brand: String(fd.get('brand')),
        model: String(fd.get('model')),
        year: Number(fd.get('year')),
        color: String(fd.get('color') || '') || undefined,
        category: String(fd.get('category') || '') || undefined,
        transmission: (String(fd.get('transmission')) as 'MANUAL' | 'AUTOMATIC') || undefined,
        fuel: (String(fd.get('fuel')) as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'LPG') || undefined,
        seats: fd.get('seats') ? Number(fd.get('seats')) : undefined,
        currentKm: fd.get('currentKm') ? Number(fd.get('currentKm')) : undefined,
        dailyRate: Number(fd.get('dailyRate')),
        weeklyRate: fd.get('weeklyRate') ? Number(fd.get('weeklyRate')) : undefined,
        monthlyRate: fd.get('monthlyRate') ? Number(fd.get('monthlyRate')) : undefined,
        insuranceExpiry: String(fd.get('insuranceExpiry') || '') || undefined,
        technicalVisitExpiry: String(fd.get('technicalVisitExpiry') || '') || undefined,
        photos: photos.length > 0 ? photos : undefined,
        notes: String(fd.get('notes') || '') || undefined,
      });
      router.push('/vehicles');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Nouveau véhicule" description="Ajouter un véhicule au parc" />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du véhicule</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Immatriculation" htmlFor="registration" required>
              <Input id="registration" name="registration" required />
            </Field>
            <Field label="Année" htmlFor="year" required>
              <Input id="year" name="year" type="number" min={1950} max={2100} defaultValue={new Date().getFullYear()} required />
            </Field>
            <Field label="Marque" htmlFor="brand" required>
              <Input id="brand" name="brand" required />
            </Field>
            <Field label="Modèle" htmlFor="model" required>
              <Input id="model" name="model" required />
            </Field>
            <Field label="Couleur" htmlFor="color">
              <Input id="color" name="color" />
            </Field>
            <Field label="Catégorie" htmlFor="category">
              <Input id="category" name="category" placeholder="SUV, berline, citadine…" />
            </Field>
            <Field label="Transmission" htmlFor="transmission">
              <Select id="transmission" name="transmission" defaultValue="MANUAL">
                <option value="MANUAL">Manuelle</option>
                <option value="AUTOMATIC">Automatique</option>
              </Select>
            </Field>
            <Field label="Carburant" htmlFor="fuel">
              <Select id="fuel" name="fuel" defaultValue="PETROL">
                <option value="PETROL">Essence</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybride</option>
                <option value="ELECTRIC">Électrique</option>
                <option value="LPG">GPL</option>
              </Select>
            </Field>
            <Field label="Places" htmlFor="seats">
              <Input id="seats" name="seats" type="number" min={1} max={50} defaultValue={5} />
            </Field>
            <Field label="Kilométrage actuel" htmlFor="currentKm">
              <Input id="currentKm" name="currentKm" type="number" min={0} defaultValue={0} />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Tarification</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Tarif/jour (MAD)" htmlFor="dailyRate" required>
              <Input id="dailyRate" name="dailyRate" type="number" step="0.01" min={0} required />
            </Field>
            <Field label="Tarif/semaine" htmlFor="weeklyRate">
              <Input id="weeklyRate" name="weeklyRate" type="number" step="0.01" min={0} />
            </Field>
            <Field label="Tarif/mois" htmlFor="monthlyRate">
              <Input id="monthlyRate" name="monthlyRate" type="number" step="0.01" min={0} />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Documents & notes</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Expiration assurance" htmlFor="insuranceExpiry">
              <Input id="insuranceExpiry" name="insuranceExpiry" type="date" />
            </Field>
            <Field label="Expiration visite technique" htmlFor="technicalVisitExpiry">
              <Input id="technicalVisitExpiry" name="technicalVisitExpiry" type="date" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes" htmlFor="notes">
                <Textarea id="notes" name="notes" rows={3} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <ImageUploader
                value={photos}
                onChange={setPhotos}
                kind="vehicle"
                max={8}
                label="Photos du véhicule"
              />
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
