'use client';

import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUploader } from '@/components/ui/image-uploader';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { vehiclesApi } from '@/lib/resources';
import type { VehicleDto, VehicleStatusName } from '@autosphere/shared';

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

export default function EditVehiclePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const canEdit = hasRole('ADMIN', 'MANAGER');
  const canDelete = hasRole('ADMIN');

  const [vehicle, setVehicle] = useState<VehicleDto | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    vehiclesApi
      .get(id)
      .then((v) => {
        setVehicle(v);
        setPhotos(v.photos ?? []);
      })
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
      const updated = await vehiclesApi.update(id, {
        registration: String(fd.get('registration')),
        brand: String(fd.get('brand')),
        model: String(fd.get('model')),
        year: Number(fd.get('year')),
        color: String(fd.get('color') || '') || undefined,
        category: String(fd.get('category') || '') || undefined,
        transmission: String(fd.get('transmission')) as 'MANUAL' | 'AUTOMATIC',
        fuel: String(fd.get('fuel')) as 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'LPG',
        seats: fd.get('seats') ? Number(fd.get('seats')) : undefined,
        currentKm: fd.get('currentKm') ? Number(fd.get('currentKm')) : undefined,
        dailyRate: Number(fd.get('dailyRate')),
        weeklyRate: fd.get('weeklyRate') ? Number(fd.get('weeklyRate')) : undefined,
        monthlyRate: fd.get('monthlyRate') ? Number(fd.get('monthlyRate')) : undefined,
        insuranceExpiry: String(fd.get('insuranceExpiry') || '') || undefined,
        technicalVisitExpiry: String(fd.get('technicalVisitExpiry') || '') || undefined,
        vignetteExpiry: String(fd.get('vignetteExpiry') || '') || undefined,
        status: String(fd.get('status')) as VehicleStatusName,
        photos,
        notes: String(fd.get('notes') || '') || undefined,
      });
      setVehicle(updated);
      setPhotos(updated.photos ?? []);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour échouée');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!id) return;
    if (!confirm('Supprimer ce véhicule ? Cette action est réversible (soft delete).')) return;
    setDeleting(true);
    setError(null);
    try {
      await vehiclesApi.delete(id);
      router.push('/vehicles');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression échouée');
      setDeleting(false);
    }
  }

  if (!vehicle) {
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
        href="/vehicles"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3 w-3" />
        Tous les véhicules
      </Link>

      <PageHeader
        title={`${vehicle.brand} ${vehicle.model} · ${vehicle.registration}`}
        description={`Statut actuel : ${vehicle.status} · ${vehicle.currentKm.toLocaleString('fr-FR')} km`}
        actions={
          canDelete && (
            <Button variant="danger" onClick={onDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          )
        }
      />

      {!canEdit && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Lecture seule : seul un ADMIN ou MANAGER peut modifier un véhicule.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <fieldset disabled={!canEdit}>
          <Card>
            <CardHeader>
              <CardTitle>Identité</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Immatriculation" htmlFor="registration" required>
                <Input id="registration" name="registration" defaultValue={vehicle.registration} required />
              </Field>
              <Field label="Statut" htmlFor="status">
                <Select id="status" name="status" defaultValue={vehicle.status}>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="RENTED">Loué</option>
                  <option value="MAINTENANCE">En maintenance</option>
                  <option value="INACTIVE">Inactif</option>
                </Select>
              </Field>
              <Field label="Marque" htmlFor="brand" required>
                <Input id="brand" name="brand" defaultValue={vehicle.brand} required />
              </Field>
              <Field label="Modèle" htmlFor="model" required>
                <Input id="model" name="model" defaultValue={vehicle.model} required />
              </Field>
              <Field label="Année" htmlFor="year" required>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  min={1950}
                  max={2100}
                  defaultValue={vehicle.year}
                  required
                />
              </Field>
              <Field label="Couleur" htmlFor="color">
                <Input id="color" name="color" defaultValue={vehicle.color ?? ''} />
              </Field>
              <Field label="Catégorie" htmlFor="category">
                <Input id="category" name="category" defaultValue={vehicle.category ?? ''} />
              </Field>
              <Field label="Transmission" htmlFor="transmission">
                <Select id="transmission" name="transmission" defaultValue={vehicle.transmission}>
                  <option value="MANUAL">Manuelle</option>
                  <option value="AUTOMATIC">Automatique</option>
                </Select>
              </Field>
              <Field label="Carburant" htmlFor="fuel">
                <Select id="fuel" name="fuel" defaultValue={vehicle.fuel}>
                  <option value="PETROL">Essence</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="HYBRID">Hybride</option>
                  <option value="ELECTRIC">Électrique</option>
                  <option value="LPG">GPL</option>
                </Select>
              </Field>
              <Field label="Places" htmlFor="seats">
                <Input id="seats" name="seats" type="number" min={1} max={50} defaultValue={vehicle.seats} />
              </Field>
              <Field label="Kilométrage" htmlFor="currentKm">
                <Input
                  id="currentKm"
                  name="currentKm"
                  type="number"
                  min={0}
                  defaultValue={vehicle.currentKm}
                />
              </Field>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Tarification</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Tarif/jour (MAD)" htmlFor="dailyRate" required>
                <Input
                  id="dailyRate"
                  name="dailyRate"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={vehicle.dailyRate}
                  required
                />
              </Field>
              <Field label="Tarif/semaine" htmlFor="weeklyRate">
                <Input
                  id="weeklyRate"
                  name="weeklyRate"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={vehicle.weeklyRate ?? ''}
                />
              </Field>
              <Field label="Tarif/mois" htmlFor="monthlyRate">
                <Input
                  id="monthlyRate"
                  name="monthlyRate"
                  type="number"
                  step="0.01"
                  min={0}
                  defaultValue={vehicle.monthlyRate ?? ''}
                />
              </Field>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Expiration assurance" htmlFor="insuranceExpiry">
                <Input
                  id="insuranceExpiry"
                  name="insuranceExpiry"
                  type="date"
                  defaultValue={toDateInput(vehicle.insuranceExpiry)}
                />
              </Field>
              <Field label="Visite technique" htmlFor="technicalVisitExpiry">
                <Input
                  id="technicalVisitExpiry"
                  name="technicalVisitExpiry"
                  type="date"
                  defaultValue={toDateInput(vehicle.technicalVisitExpiry)}
                />
              </Field>
              <Field label="Vignette" htmlFor="vignetteExpiry">
                <Input
                  id="vignetteExpiry"
                  name="vignetteExpiry"
                  type="date"
                  defaultValue={toDateInput(vehicle.vignetteExpiry)}
                />
              </Field>
              <div className="md:col-span-3">
                <Field label="Notes" htmlFor="notes">
                  <Textarea id="notes" name="notes" rows={3} defaultValue={vehicle.notes ?? ''} />
                </Field>
              </div>
              <div className="md:col-span-3">
                <ImageUploader
                  value={photos}
                  onChange={setPhotos}
                  kind="vehicle"
                  max={8}
                  label="Photos du véhicule"
                  disabled={!canEdit}
                />
              </div>
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
            <Link href="/vehicles">
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button type="submit" loading={loading}>Enregistrer les modifications</Button>
          </div>
        )}
      </form>
    </div>
  );
}
