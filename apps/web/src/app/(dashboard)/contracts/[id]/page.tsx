'use client';

import { ArrowLeft, Ban, CheckCircle2, FileDown } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError, downloadFile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { contractsApi } from '@/lib/resources';
import type { ContractStatusName, RentalContractDto } from '@autosphere/shared';

const STATUS_TONE: Record<ContractStatusName, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  DRAFT: 'slate',
  ACTIVE: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ContractDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'MANAGER', 'EMPLOYEE');
  const canCancel = hasRole('ADMIN', 'MANAGER');

  const [c, setC] = useState<RentalContractDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [kmEnd, setKmEnd] = useState(0);
  const [extraCharges, setExtraCharges] = useState(0);

  const load = useCallback(() => {
    if (!id) return;
    contractsApi
      .get(id)
      .then((res) => {
        setC(res);
        setKmEnd(res.kmStart);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function complete() {
    if (!id) return;
    if (kmEnd < (c?.kmStart ?? 0)) {
      setError('Le kilométrage final doit être ≥ kilométrage de départ.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await contractsApi.complete(id, { kmEnd, extraCharges: extraCharges || undefined });
      load();
      setCompleteOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Clôture échouée');
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!id) return;
    if (!confirm('Annuler ce contrat ?')) return;
    setBusy(true);
    try {
      await contractsApi.cancel(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    if (!id || !c) return;
    setDownloading(true);
    setError(null);
    try {
      await downloadFile(contractsApi.pdfPath(id), `${c.contractNumber}.pdf`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Téléchargement échoué');
    } finally {
      setDownloading(false);
    }
  }

  if (!c) {
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

  const isClosed = c.status === 'COMPLETED' || c.status === 'CANCELLED';

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/contracts"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3 w-3" />
        Tous les contrats
      </Link>

      <PageHeader
        title={c.contractNumber}
        description={`Créé le ${formatDateTime(c.createdAt)}${
          c.reservationId ? ` · issu d'une réservation` : ''
        }`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[c.status] ?? 'slate'}>{c.status}</Badge>
            <Button variant="secondary" onClick={downloadPdf} loading={downloading}>
              <FileDown className="h-4 w-4" />
              Imprimer le contrat (PDF)
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Période & kilométrage</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <KV label="Date de début" value={formatDateTime(c.startDate)} />
          <KV label="Date de fin" value={formatDateTime(c.endDate)} />
          <KV label="Retour réel" value={formatDateTime(c.actualReturnDate)} />
          <KV
            label="Kilométrage"
            value={`${c.kmStart.toLocaleString('fr-FR')}${
              c.kmEnd !== null ? ` → ${c.kmEnd.toLocaleString('fr-FR')}` : ''
            } km`}
          />
          <KV
            label="Forfait km"
            value={c.kmAllowance ? `${c.kmAllowance} km/jour` : 'Illimité'}
          />
          <KV label="Lieu prise / retour" value={`${c.pickupLocation ?? '—'} / ${c.returnLocation ?? '—'}`} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarification & caution</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <KV label="Tarif journalier" value={`${Number(c.dailyRate).toFixed(2)} MAD`} />
          <KV label="Total" value={`${Number(c.totalAmount).toFixed(2)} MAD`} />
          <KV label="Caution" value={`${Number(c.depositAmount).toFixed(2)} MAD`} />
          <KV label="Mode caution" value={c.depositMethod ?? '—'} />
          <KV label="Frais supplémentaires" value={`${Number(c.extraCharges).toFixed(2)} MAD`} />
          <KV label="Remise" value={`${Number(c.discountAmount).toFixed(2)} MAD`} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conducteur additionnel & notes</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3 text-sm">
          <KV label="Conducteur additionnel" value={c.additionalDriver ?? '—'} />
          <KV label="Permis additionnel" value={c.additionalDriverLicense ?? '—'} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Notes</p>
            <p className="mt-1 text-slate-700 whitespace-pre-line">
              {c.notes || <span className="text-slate-400">— aucune note —</span>}
            </p>
          </div>
        </CardBody>
      </Card>

      {canManage && !isClosed && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            <Button onClick={() => setCompleteOpen((v) => !v)} disabled={busy}>
              <CheckCircle2 className="h-4 w-4" />
              Clôturer le contrat
            </Button>
            {canCancel && (
              <Button variant="danger" onClick={cancel} disabled={busy}>
                <Ban className="h-4 w-4" />
                Annuler le contrat
              </Button>
            )}
          </CardBody>
          {completeOpen && (
            <CardBody className="border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Km de retour" htmlFor="kmEnd">
                <Input
                  id="kmEnd"
                  type="number"
                  min={c.kmStart}
                  value={kmEnd}
                  onChange={(e) => setKmEnd(Number(e.currentTarget.value) || 0)}
                />
              </Field>
              <Field label="Frais supplémentaires (MAD)" htmlFor="extra">
                <Input
                  id="extra"
                  type="number"
                  step="0.01"
                  min={0}
                  value={extraCharges}
                  onChange={(e) => setExtraCharges(Number(e.currentTarget.value) || 0)}
                />
              </Field>
              <div className="md:col-span-3 flex justify-end">
                <Button onClick={complete} loading={busy}>
                  Valider la clôture
                </Button>
              </div>
            </CardBody>
          )}
        </Card>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-slate-900">{value}</p>
    </div>
  );
}
