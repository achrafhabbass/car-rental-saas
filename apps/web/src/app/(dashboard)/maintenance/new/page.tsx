'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { maintenanceApi, vehiclesApi } from '@/lib/resources';
import type {
  MaintenanceTypeName,
  VehicleDto,
} from '@autosphere/shared';

type Mode = 'record' | 'schedule';

export default function NewMaintenancePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('record');
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    vehiclesApi
      .list({ pageSize: 200 })
      .then((r) => setVehicles(r.items))
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const type = String(fd.get('type')) as MaintenanceTypeName;
    try {
      if (mode === 'record') {
        await maintenanceApi.createRecord({
          vehicleId: String(fd.get('vehicleId')),
          type,
          title: String(fd.get('title')),
          description: String(fd.get('description') || '') || undefined,
          performedAt: fd.get('performedAt')
            ? new Date(String(fd.get('performedAt'))).toISOString()
            : undefined,
          km: fd.get('km') ? Number(fd.get('km')) : undefined,
          cost: fd.get('cost') ? Number(fd.get('cost')) : undefined,
          garage: String(fd.get('garage') || '') || undefined,
          reference: String(fd.get('reference') || '') || undefined,
          notes: String(fd.get('notes') || '') || undefined,
        });
      } else {
        await maintenanceApi.createSchedule({
          vehicleId: String(fd.get('vehicleId')),
          type,
          title: String(fd.get('title')),
          description: String(fd.get('description') || '') || undefined,
          dueDate: String(fd.get('dueDate') || '') || undefined,
          dueKm: fd.get('dueKm') ? Number(fd.get('dueKm')) : undefined,
          isCritical: fd.get('isCritical') === 'on',
          notes: String(fd.get('notes') || '') || undefined,
        });
      }
      router.push('/maintenance');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={mode === 'record' ? 'Nouvel entretien effectué' : 'Planifier un entretien'}
        description={
          mode === 'record'
            ? 'Enregistrer une intervention de maintenance'
            : 'Planifier un entretien à venir (périodique)'
        }
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'record' ? 'primary' : 'secondary'}
          onClick={() => setMode('record')}
        >
          Intervention passée
        </Button>
        <Button
          type="button"
          variant={mode === 'schedule' ? 'primary' : 'secondary'}
          onClick={() => setMode('schedule')}
        >
          Planifier
        </Button>
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
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
            <Field label="Type" htmlFor="type" required>
              <Select id="type" name="type" required defaultValue="OIL_CHANGE">
                <option value="OIL_CHANGE">Vidange</option>
                <option value="REVISION">Révision</option>
                <option value="TIRE_CHANGE">Pneus</option>
                <option value="BRAKES">Freins</option>
                <option value="BATTERY">Batterie</option>
                <option value="INSPECTION">Contrôle / inspection</option>
                <option value="REPAIR">Réparation</option>
                <option value="OTHER">Autre</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Titre" htmlFor="title" required>
                <Input id="title" name="title" required placeholder="Ex: Vidange 15 000 km" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Description" htmlFor="description">
                <Textarea id="description" name="description" rows={2} />
              </Field>
            </div>

            {mode === 'record' ? (
              <>
                <Field label="Date d'intervention" htmlFor="performedAt">
                  <Input id="performedAt" name="performedAt" type="datetime-local" />
                </Field>
                <Field label="Kilométrage" htmlFor="km">
                  <Input id="km" name="km" type="number" min={0} />
                </Field>
                <Field label="Coût (MAD)" htmlFor="cost">
                  <Input id="cost" name="cost" type="number" step="0.01" min={0} />
                </Field>
                <Field label="Garage" htmlFor="garage">
                  <Input id="garage" name="garage" />
                </Field>
                <Field label="Référence / N° facture" htmlFor="reference">
                  <Input id="reference" name="reference" />
                </Field>
              </>
            ) : (
              <>
                <Field label="Échéance (date)" htmlFor="dueDate">
                  <Input id="dueDate" name="dueDate" type="date" />
                </Field>
                <Field label="Échéance (km)" htmlFor="dueKm">
                  <Input id="dueKm" name="dueKm" type="number" min={0} />
                </Field>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      id="isCritical"
                      name="isCritical"
                      className="rounded border-slate-300"
                    />
                    <span>
                      Entretien <strong>critique</strong> — bloque toute réservation tant
                      qu'il n'est pas effectué
                    </span>
                  </label>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <Field label="Notes" htmlFor="notes">
                <Textarea id="notes" name="notes" rows={2} />
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
