'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { inspectionsApi } from '@/lib/resources';
import type { VehicleInspectionDto } from '@autosphere/shared';

interface RowExtra {
  vehicle?: { registration: string; brand: string; model: string };
  contract?: { contractNumber: string };
}

const FUEL_LABEL: Record<string, string> = {
  EMPTY: 'Vide',
  QUARTER: '1/4',
  HALF: '1/2',
  THREE_QUARTERS: '3/4',
  FULL: 'Plein',
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [insp, setInsp] = useState<(VehicleInspectionDto & RowExtra) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    inspectionsApi
      .get(id)
      .then((r) => setInsp(r as VehicleInspectionDto & RowExtra))
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [id]);

  if (!insp) {
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
        href="/inspections"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3 w-3" />
        Toutes les inspections
      </Link>

      <PageHeader
        title={`Inspection · ${insp.type === 'DEPARTURE' ? 'Départ' : 'Retour'}`}
        description={`Effectuée le ${fmt(insp.performedAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={insp.type === 'DEPARTURE' ? 'blue' : 'amber'}>
              {insp.type === 'DEPARTURE' ? 'DÉPART' : 'RETOUR'}
            </Badge>
            <Badge tone={insp.status === 'COMPLETED' ? 'green' : 'slate'}>
              {insp.status}
            </Badge>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Identification</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <KV
            label="Contrat"
            value={
              <Link href={`/contracts/${insp.contractId}`} className="text-secondary hover:underline">
                {insp.contract?.contractNumber ?? insp.contractId}
              </Link>
            }
          />
          <KV
            label="Véhicule"
            value={
              insp.vehicle
                ? `${insp.vehicle.brand} ${insp.vehicle.model} · ${insp.vehicle.registration}`
                : '—'
            }
          />
          <KV label="Agent" value={insp.agentName ?? '—'} />
          <KV label="Signature client" value={insp.signatureUrl ?? '—'} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>État du véhicule</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <KV label="Kilométrage" value={`${insp.km.toLocaleString('fr-FR')} km`} />
          <KV label="Niveau de carburant" value={FUEL_LABEL[insp.fuelLevel] ?? insp.fuelLevel} />
          <KV label="État général" value={insp.condition} />
          <div className="md:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Description des dommages
            </p>
            <p className="mt-1 text-slate-700 whitespace-pre-line">
              {insp.damages || <span className="text-slate-400">Aucun dommage constaté.</span>}
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Notes</p>
            <p className="mt-1 text-slate-700 whitespace-pre-line">
              {insp.notes || <span className="text-slate-400">— aucune note —</span>}
            </p>
          </div>
        </CardBody>
      </Card>

      {insp.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-1 text-sm">
              {insp.photos.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-secondary hover:underline truncate inline-block max-w-full"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-slate-900">{value}</p>
    </div>
  );
}
