'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import {
  clientsApi,
  contractsApi,
  invoicesApi,
  paymentsApi,
} from '@/lib/resources';
import type { ClientDto, InvoiceDto, RentalContractDto } from '@autosphere/shared';

export default function NewPaymentPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [contracts, setContracts] = useState<RentalContractDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      clientsApi.list({ pageSize: 200 }),
      contractsApi.list({ pageSize: 200, status: 'ACTIVE' }),
      invoicesApi.list({ pageSize: 200 }),
    ])
      .then(([c, co, inv]) => {
        setClients(c.items);
        setContracts(co.items);
        setInvoices(inv.items.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED'));
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
      await paymentsApi.create({
        clientId: String(fd.get('clientId')),
        contractId: String(fd.get('contractId') || '') || undefined,
        invoiceId: String(fd.get('invoiceId') || '') || undefined,
        amount: Number(fd.get('amount')),
        method: (String(fd.get('method')) as 'CASH' | 'CHECK' | 'CARD' | 'BANK_TRANSFER' | 'ONLINE') || undefined,
        reference: String(fd.get('reference') || '') || undefined,
        paidAt: fd.get('paidAt') ? new Date(String(fd.get('paidAt'))).toISOString() : undefined,
        notes: String(fd.get('notes') || '') || undefined,
      });
      router.push('/payments');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Nouveau paiement" description="Enregistrer un encaissement" />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Client" htmlFor="clientId" required>
              <Select id="clientId" name="clientId" required>
                <option value="">— Sélectionner —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} · {c.idNumber}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Contrat (optionnel)" htmlFor="contractId">
              <Select id="contractId" name="contractId">
                <option value="">—</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Facture (optionnel)" htmlFor="invoiceId">
              <Select id="invoiceId" name="invoiceId">
                <option value="">—</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.invoiceNumber} · solde {Number(i.balance).toFixed(2)} MAD
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Montant (MAD)" htmlFor="amount" required>
              <Input id="amount" name="amount" type="number" step="0.01" min={0.01} required />
            </Field>
            <Field label="Méthode" htmlFor="method">
              <Select id="method" name="method" defaultValue="CASH">
                <option value="CASH">Espèces</option>
                <option value="CHECK">Chèque</option>
                <option value="CARD">Carte bancaire</option>
                <option value="BANK_TRANSFER">Virement</option>
                <option value="ONLINE">En ligne</option>
              </Select>
            </Field>
            <Field label="Référence" htmlFor="reference">
              <Input id="reference" name="reference" />
            </Field>
            <Field label="Date" htmlFor="paidAt">
              <Input id="paidAt" name="paidAt" type="datetime-local" />
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
