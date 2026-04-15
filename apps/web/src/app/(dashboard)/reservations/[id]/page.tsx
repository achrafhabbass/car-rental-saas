'use client';

import { ArrowLeft, Ban, FileText, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { PartiesCard } from '@/components/business/parties-card';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { clientsApi, reservationsApi, vehiclesApi } from '@/lib/resources';
import type {
  ClientDto,
  ReservationDto,
  ReservationPaymentStatusName,
  ReservationStatusName,
  VehicleDto,
} from '@autosphere/shared';

const STATUS_TONE: Record<ReservationStatusName, 'green' | 'blue' | 'amber' | 'red' | 'slate'> = {
  PENDING: 'amber',
  CONFIRMED: 'blue',
  CONVERTED: 'green',
  CANCELLED: 'red',
  NO_SHOW: 'slate',
  OVERDUE: 'red',
  COMPLETED: 'green',
};

const PAYMENT_TONE: Record<ReservationPaymentStatusName, 'green' | 'amber' | 'red' | 'slate'> = {
  PENDING: 'amber',
  PARTIAL: 'amber',
  PAID: 'green',
  REFUNDED: 'slate',
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

export default function ReservationDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'MANAGER', 'EMPLOYEE');
  const canCancel = hasRole('ADMIN', 'MANAGER');

  const [r, setR] = useState<ReservationDto | null>(null);
  const [client, setClient] = useState<ClientDto | null>(null);
  const [vehicle, setVehicle] = useState<VehicleDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<ReservationPaymentStatusName>('PENDING');
  const [convertOpen, setConvertOpen] = useState(false);
  const [kmStart, setKmStart] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositMethod, setDepositMethod] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    reservationsApi
      .get(id)
      .then((res) => {
        setR(res);
        setPaymentStatus(res.paymentStatus);
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

  async function savePaymentStatus() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await reservationsApi.updatePaymentStatus(id, paymentStatus);
      setR(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!id) return;
    if (!confirm('Annuler cette réservation ?')) return;
    setBusy(true);
    try {
      await reservationsApi.cancel(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec');
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const result = await reservationsApi.convertToContract(id, {
        kmStart,
        depositAmount: depositAmount || undefined,
        depositMethod: (depositMethod as 'CASH' | 'CHECK' | 'CARD' | 'CARD_IMPRINT' | 'BANK_TRANSFER') || undefined,
      });
      router.push(`/contracts/${result.contractId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Conversion échouée');
    } finally {
      setBusy(false);
    }
  }

  if (!r) {
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

  const isClosed =
    r.status === 'CANCELLED' || r.status === 'CONVERTED' || r.status === 'COMPLETED';

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/reservations"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-3 w-3" />
        Toutes les réservations
      </Link>

      <PageHeader
        title={r.reservationCode}
        description={`Créée le ${formatDateTime(r.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[r.status] ?? 'slate'}>{r.status}</Badge>
            <Badge tone={PAYMENT_TONE[r.paymentStatus] ?? 'slate'}>
              Paiement · {r.paymentStatus}
            </Badge>
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
          <CardTitle>Période & lieux</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <KV label="Date de début" value={formatDateTime(r.startDate)} />
          <KV label="Date de fin" value={formatDateTime(r.endDate)} />
          <KV label="Lieu de prise" value={r.pickupLocation ?? '—'} />
          <KV label="Lieu de retour" value={r.returnLocation ?? '—'} />
          <KV label="Source" value={r.source} />
          <KV
            label="Total"
            value={`${Number(r.totalAmount).toFixed(2)} MAD (${Number(r.dailyRate).toFixed(2)} / jour)`}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {r.notes || <span className="text-slate-400">— aucune note —</span>}
          </p>
        </CardBody>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Statut de paiement</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <Field label="" htmlFor="ps">
                <Select
                  id="ps"
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.currentTarget.value as ReservationPaymentStatusName)
                  }
                >
                  <option value="PENDING">En attente</option>
                  <option value="PARTIAL">Partiel</option>
                  <option value="PAID">Payé</option>
                  <option value="REFUNDED">Remboursé</option>
                </Select>
              </Field>
            </div>
            <Button onClick={savePaymentStatus} loading={busy}>
              <Wallet className="h-4 w-4" />
              Mettre à jour
            </Button>
          </CardBody>
        </Card>
      )}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {!isClosed && (
              <Button
                onClick={() => setConvertOpen((v) => !v)}
                disabled={busy}
              >
                <FileText className="h-4 w-4" />
                Convertir en contrat
              </Button>
            )}
            {!isClosed && canCancel && (
              <Button variant="danger" onClick={cancel} disabled={busy}>
                <Ban className="h-4 w-4" />
                Annuler la réservation
              </Button>
            )}
            {isClosed && (
              <p className="text-sm text-slate-500">
                Cette réservation est verrouillée (statut {r.status}).
              </p>
            )}
          </CardBody>

          {convertOpen && !isClosed && (
            <CardBody className="border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Km au départ" htmlFor="kmStart">
                <Input
                  id="kmStart"
                  type="number"
                  min={0}
                  value={kmStart}
                  onChange={(e) => setKmStart(Number(e.currentTarget.value) || 0)}
                />
              </Field>
              <Field label="Caution (MAD)" htmlFor="dep">
                <Input
                  id="dep"
                  type="number"
                  step="0.01"
                  min={0}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.currentTarget.value) || 0)}
                />
              </Field>
              <Field label="Mode caution" htmlFor="dm">
                <Select
                  id="dm"
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.currentTarget.value)}
                >
                  <option value="">—</option>
                  <option value="CASH">Espèces</option>
                  <option value="CHECK">Chèque</option>
                  <option value="CARD">Carte bancaire</option>
                  <option value="CARD_IMPRINT">Empreinte CB</option>
                  <option value="BANK_TRANSFER">Virement</option>
                </Select>
              </Field>
              <div className="md:col-span-3 flex justify-end">
                <Button onClick={convert} loading={busy}>
                  Créer le contrat
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
