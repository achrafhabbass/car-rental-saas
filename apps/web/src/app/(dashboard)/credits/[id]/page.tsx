'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError } from '@/lib/api';
import { creditsApi } from '@/lib/resources';
import type { CreditPaymentDto, VehicleCreditDto } from '@autosphere/shared';

const INSTALLMENT_TONE: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  PAID: 'green',
  SCHEDULED: 'slate',
  LATE: 'red',
  SKIPPED: 'amber',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CreditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [credit, setCredit] = useState<VehicleCreditDto | null>(null);
  const [schedule, setSchedule] = useState<CreditPaymentDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([creditsApi.get(id), creditsApi.schedule(id)])
      .then(([c, s]) => {
        setCredit(c);
        setSchedule(s);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, [id]);

  if (error) {
    return (
      <div className="max-w-container">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!credit) {
    return <div className="text-sm text-slate-400">Chargement…</div>;
  }

  const progress =
    Number(credit.principal) > 0
      ? (Number(credit.totalPaid) / Number(credit.principal)) * 100
      : 0;

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title={`Crédit ${credit.bankName}`}
        description={`${credit.creditType === 'LEASING' ? 'Leasing' : 'Crédit bancaire'} · ${credit.termMonths} mois`}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Principal</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{Number(credit.principal).toFixed(2)} MAD</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Capital restant</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{Number(credit.remainingBalance).toFixed(2)} MAD</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total versé</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{Number(credit.totalPaid).toFixed(2)} MAD</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-primary-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Mensualité</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{Number(credit.monthlyPayment).toFixed(2)} MAD</p>
            <p className="text-xs text-slate-400 mt-1">Taux {Number(credit.interestRate).toFixed(2)} %</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tableau d'amortissement</CardTitle>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>N°</Th>
              <Th>Échéance</Th>
              <Th>Montant</Th>
              <Th>Capital</Th>
              <Th>Intérêts</Th>
              <Th>Payé le</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            {schedule === null ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">Chargement…</Td>
              </Tr>
            ) : schedule.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-8">
                  Aucune échéance.
                </Td>
              </Tr>
            ) : (
              schedule.map((row) => (
                <Tr key={row.id}>
                  <Td className="font-medium">{row.installmentNumber}</Td>
                  <Td>{formatDate(row.scheduledDate)}</Td>
                  <Td className="font-semibold">{Number(row.scheduledAmount).toFixed(2)} MAD</Td>
                  <Td>{Number(row.principalPortion).toFixed(2)}</Td>
                  <Td>{Number(row.interestPortion).toFixed(2)}</Td>
                  <Td>{row.paidAt ? formatDate(row.paidAt) : '—'}</Td>
                  <Td>
                    <Badge tone={INSTALLMENT_TONE[row.status] ?? 'slate'}>{row.status}</Badge>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
