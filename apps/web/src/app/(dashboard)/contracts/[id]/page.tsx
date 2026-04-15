'use client';

import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  PiggyBank,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { PartiesCard } from '@/components/business/parties-card';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError, downloadFile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  clientsApi,
  contractsApi,
  depositsApi,
  inspectionsApi,
  vehiclesApi,
} from '@/lib/resources';
import { useToast } from '@/lib/toast-context';
import type {
  ClientDto,
  ContractStatusName,
  DepositDto,
  RentalContractDto,
  VehicleDto,
  VehicleInspectionDto,
} from '@autosphere/shared';

const STATUS_TONE: Record<ContractStatusName, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  DRAFT: 'slate',
  ACTIVE: 'blue',
  RETURNED: 'amber',
  COMPLETED: 'green',
  CANCELLED: 'red',
  OVERDUE: 'red',
};

const DEPOSIT_TONE: Record<string, 'amber' | 'green' | 'red' | 'slate'> = {
  HELD: 'amber',
  REFUNDED: 'green',
  PARTIAL_REFUND: 'amber',
  CONSUMED: 'red',
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

  const toast = useToast();
  const canSettleDeposit = hasRole('ADMIN', 'MANAGER', 'ACCOUNTANT');

  const [c, setC] = useState<RentalContractDto | null>(null);
  const [client, setClient] = useState<ClientDto | null>(null);
  const [vehicle, setVehicle] = useState<VehicleDto | null>(null);
  const [deposit, setDeposit] = useState<DepositDto | null>(null);
  const [inspections, setInspections] = useState<VehicleInspectionDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [kmEnd, setKmEnd] = useState(0);
  const [extraCharges, setExtraCharges] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [depositOpen, setDepositOpen] = useState<null | 'collect' | 'refund-partial' | 'consume'>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositMethod, setDepositMethod] = useState<'CASH' | 'CHECK' | 'CARD' | 'CARD_IMPRINT' | 'BANK_TRANSFER'>('CASH');

  const load = useCallback(() => {
    if (!id) return;
    Promise.all([
      contractsApi.get(id),
      depositsApi.forContract(id).catch(() => null),
      inspectionsApi.forContract(id).catch(() => []),
    ])
      .then(([res, dep, insp]) => {
        setC(res);
        setKmEnd(res.kmStart);
        setDeposit(dep);
        setInspections(insp ?? []);
        void clientsApi.get(res.clientId).then(setClient).catch(() => setClient(null));
        void vehiclesApi.get(res.vehicleId).then(setVehicle).catch(() => setVehicle(null));
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
      toast.success('Contrat clôturé', `Véhicule disponible · ${kmEnd.toLocaleString('fr-FR')} km`);
      load();
      setCompleteOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Clôture échouée');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancelAction() {
    if (!id) return;
    setBusy(true);
    try {
      await contractsApi.cancel(id);
      toast.info('Contrat annulé');
      load();
      setConfirmCancel(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Annulation échouée', msg);
    } finally {
      setBusy(false);
    }
  }

  async function depositAction() {
    if (!id || !depositOpen) return;
    setBusy(true);
    setError(null);
    try {
      if (depositOpen === 'collect') {
        if (depositAmount <= 0) {
          setError('Saisir un montant > 0');
          setBusy(false);
          return;
        }
        await depositsApi.collect({
          contractId: id,
          amount: depositAmount,
          method: depositMethod,
        });
        toast.success('Caution encaissée');
      } else if (depositOpen === 'refund-partial' && deposit) {
        await depositsApi.refundPartial(deposit.id, { amount: depositAmount });
        toast.success('Remboursement partiel enregistré');
      } else if (depositOpen === 'consume' && deposit) {
        await depositsApi.consume(deposit.id, { amount: depositAmount });
        toast.success('Caution conservée');
      }
      setDepositOpen(null);
      setDepositAmount(0);
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Action sur la caution', msg);
    } finally {
      setBusy(false);
    }
  }

  async function refundFull() {
    if (!deposit) return;
    setBusy(true);
    try {
      await depositsApi.refundFull(deposit.id);
      toast.success('Caution remboursée intégralement');
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Échec';
      setError(msg);
      toast.error('Remboursement échoué', msg);
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

      <PartiesCard client={client} vehicle={vehicle} />

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

      <Card>
        <CardHeader>
          <CardTitle>Inspections</CardTitle>
          {canManage && !isClosed && (
            <div className="flex items-center gap-2">
              {!inspections.find((i) => i.type === 'DEPARTURE') && (
                <Link
                  href={`/inspections/new?contractId=${c.id}&type=DEPARTURE`}
                  className="text-xs font-medium text-secondary hover:underline"
                >
                  + Inspection de départ
                </Link>
              )}
              {!inspections.find((i) => i.type === 'RETURN') && (
                <Link
                  href={`/inspections/new?contractId=${c.id}&type=RETURN`}
                  className="text-xs font-medium text-secondary hover:underline"
                >
                  + Inspection de retour
                </Link>
              )}
            </div>
          )}
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          {inspections.length === 0 ? (
            <p className="text-slate-400 text-center py-3">Aucune inspection enregistrée.</p>
          ) : (
            inspections.map((i) => (
              <Link
                key={i.id}
                href={`/inspections/${i.id}`}
                className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-900">
                    {i.type === 'DEPARTURE' ? 'Départ' : 'Retour'}
                  </span>
                  <span className="text-slate-500">
                    · {new Date(i.performedAt).toLocaleDateString('fr-FR')} · {i.km.toLocaleString('fr-FR')} km
                  </span>
                </div>
                <Badge tone={i.condition === 'POOR' ? 'red' : i.condition === 'FAIR' ? 'amber' : 'green'}>
                  {i.condition}
                </Badge>
              </Link>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caution</CardTitle>
          {deposit && <Badge tone={DEPOSIT_TONE[deposit.status] ?? 'slate'}>{deposit.status}</Badge>}
        </CardHeader>
        <CardBody className="space-y-3">
          {deposit ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <KV label="Numéro" value={deposit.depositNumber} />
                <KV label="Montant" value={`${Number(deposit.amount).toFixed(2)} MAD`} />
                <KV label="Mode" value={deposit.method} />
                <KV
                  label="Restant détenu"
                  value={`${(
                    Number(deposit.amount) -
                    Number(deposit.refundedAmount) -
                    Number(deposit.consumedAmount)
                  ).toFixed(2)} MAD`}
                />
                <KV label="Remboursé" value={`${Number(deposit.refundedAmount).toFixed(2)} MAD`} />
                <KV label="Conservé" value={`${Number(deposit.consumedAmount).toFixed(2)} MAD`} />
              </div>
              {canSettleDeposit && deposit.status !== 'REFUNDED' && deposit.status !== 'CONSUMED' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <Button size="sm" onClick={refundFull} disabled={busy}>
                    <RotateCcw className="h-3 w-3" />
                    Rembourser le solde
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDepositOpen('refund-partial')}
                    disabled={busy}
                  >
                    Remboursement partiel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDepositOpen('consume')}
                    disabled={busy}
                  >
                    Conserver
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Aucune caution encaissée pour ce contrat.</p>
              {canSettleDeposit && (
                <Button size="sm" onClick={() => setDepositOpen('collect')}>
                  <PiggyBank className="h-3 w-3" />
                  Encaisser une caution
                </Button>
              )}
            </div>
          )}

          {depositOpen && (
            <div className="border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Montant (MAD)" htmlFor="depAmt">
                <Input
                  id="depAmt"
                  type="number"
                  step="0.01"
                  min={0}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.currentTarget.value) || 0)}
                />
              </Field>
              {depositOpen === 'collect' && (
                <Field label="Mode" htmlFor="depMet">
                  <Select
                    id="depMet"
                    value={depositMethod}
                    onChange={(e) =>
                      setDepositMethod(
                        e.currentTarget.value as
                          | 'CASH'
                          | 'CHECK'
                          | 'CARD'
                          | 'CARD_IMPRINT'
                          | 'BANK_TRANSFER',
                      )
                    }
                  >
                    <option value="CASH">Espèces</option>
                    <option value="CHECK">Chèque</option>
                    <option value="CARD">Carte bancaire</option>
                    <option value="CARD_IMPRINT">Empreinte CB</option>
                    <option value="BANK_TRANSFER">Virement</option>
                  </Select>
                </Field>
              )}
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setDepositOpen(null)}>
                  Annuler
                </Button>
                <Button size="sm" loading={busy} onClick={depositAction}>
                  Confirmer
                </Button>
              </div>
            </div>
          )}
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
              <Button
                variant="danger"
                onClick={() => setConfirmCancel(true)}
                disabled={busy}
              >
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

      <ConfirmDialog
        open={confirmCancel}
        title="Annuler le contrat ?"
        description={
          <span>
            Le contrat <strong>{c.contractNumber}</strong> sera marqué comme annulé et le véhicule
            redeviendra disponible. Cette action ne peut pas être annulée.
          </span>
        }
        tone="danger"
        confirmLabel="Oui, annuler"
        cancelLabel="Non, conserver"
        loading={busy}
        onConfirm={confirmCancelAction}
        onCancel={() => setConfirmCancel(false)}
      />
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
