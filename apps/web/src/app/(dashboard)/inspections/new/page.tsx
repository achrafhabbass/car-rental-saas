'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { contractsApi, inspectionsApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';
import type {
  FuelLevelName,
  InspectionTypeName,
  RentalContractDto,
  VehicleConditionRatingName,
} from '@autosphere/shared';

export default function NewInspectionPage() {
  const router = useRouter();
  const params = useSearchParams();
  const presetContractId = params.get('contractId');
  const presetType = (params.get('type') as InspectionTypeName | null) ?? 'DEPARTURE';
  const toast = useToast();

  const [contracts, setContracts] = useState<RentalContractDto[]>([]);
  const [contractId, setContractId] = useState(presetContractId ?? '');
  const [type, setType] = useState<InspectionTypeName>(presetType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    contractsApi
      .list({ pageSize: 200 })
      .then((r) => setContracts(r.items))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!contractId) {
      setError('Sélectionnez un contrat');
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const created = await inspectionsApi.create({
        contractId,
        type,
        km: Number(fd.get('km')),
        fuelLevel: (String(fd.get('fuelLevel')) as FuelLevelName) || undefined,
        condition: (String(fd.get('condition')) as VehicleConditionRatingName) || undefined,
        damages: String(fd.get('damages') || '') || undefined,
        agentName: String(fd.get('agentName') || '') || undefined,
        signatureUrl: String(fd.get('signatureUrl') || '') || undefined,
        notes: String(fd.get('notes') || '') || undefined,
      });
      toast.success('Inspection enregistrée', `${type === 'DEPARTURE' ? 'Départ' : 'Retour'} · ${created.km.toLocaleString('fr-FR')} km`);
      router.push(`/inspections/${created.id}`);
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
        title="Nouvelle inspection"
        description="État du véhicule au départ ou au retour"
      />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Identification</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Contrat" htmlFor="contractId" required>
              <Select
                id="contractId"
                value={contractId}
                onChange={(e) => setContractId(e.currentTarget.value)}
                disabled={!!presetContractId}
                required
              >
                <option value="">— Sélectionner —</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type" htmlFor="type" required>
              <Select
                id="type"
                value={type}
                onChange={(e) => setType(e.currentTarget.value as InspectionTypeName)}
                required
              >
                <option value="DEPARTURE">Départ</option>
                <option value="RETURN">Retour</option>
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>État du véhicule</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Kilométrage" htmlFor="km" required>
              <Input id="km" name="km" type="number" min={0} required />
            </Field>
            <Field label="Niveau de carburant" htmlFor="fuelLevel">
              <Select id="fuelLevel" name="fuelLevel" defaultValue="FULL">
                <option value="EMPTY">Vide</option>
                <option value="QUARTER">1/4</option>
                <option value="HALF">1/2</option>
                <option value="THREE_QUARTERS">3/4</option>
                <option value="FULL">Plein</option>
              </Select>
            </Field>
            <Field label="État général" htmlFor="condition">
              <Select id="condition" name="condition" defaultValue="GOOD">
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Bon</option>
                <option value="FAIR">Moyen</option>
                <option value="POOR">Mauvais</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description des dommages" htmlFor="damages">
                <Textarea
                  id="damages"
                  name="damages"
                  rows={3}
                  placeholder="Rayures, bosses, accessoires manquants…"
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Agent & signature</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nom de l'agent" htmlFor="agentName">
              <Input id="agentName" name="agentName" />
            </Field>
            <Field
              label="URL signature client"
              htmlFor="signatureUrl"
              hint="Chemin / URL de la signature scannée (intégration future)"
            >
              <Input id="signatureUrl" name="signatureUrl" type="url" />
            </Field>
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
