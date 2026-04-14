'use client';

import { Trash2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { clientsApi, contractsApi, invoicesApi } from '@/lib/resources';
import type { ClientDto, RentalContractDto } from '@autosphere/shared';

interface LineRow {
  description: string;
  quantity: number;
  unitPrice: number;
}

function emptyRow(): LineRow {
  return { description: '', quantity: 1, unitPrice: 0 };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [contracts, setContracts] = useState<RentalContractDto[]>([]);
  const [lines, setLines] = useState<LineRow[]>([emptyRow()]);
  const [taxRate, setTaxRate] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      clientsApi.list({ pageSize: 200, blacklisted: false }),
      contractsApi.list({ pageSize: 200 }),
    ])
      .then(([c, co]) => {
        setClients(c.items);
        setContracts(co.items);
      })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : 'Chargement échoué'),
      );
  }, []);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [lines, taxRate]);

  function updateLine(i: number, patch: Partial<LineRow>) {
    setLines((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      clientId: String(fd.get('clientId')),
      contractId: String(fd.get('contractId') || '') || undefined,
      dueDate: String(fd.get('dueDate') || '') || undefined,
      taxRate,
      lineItems: lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        total: +(l.quantity * l.unitPrice).toFixed(2),
      })),
      notes: String(fd.get('notes') || '') || undefined,
    };
    try {
      await invoicesApi.create(payload);
      router.push('/invoices');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Nouvelle facture" description="Générer une facture" />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Destinataire</CardTitle>
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
            <Field label="Échéance" htmlFor="dueDate">
              <Input id="dueDate" name="dueDate" type="date" />
            </Field>
            <Field label="TVA (%)" htmlFor="taxRate">
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.currentTarget.value) || 0)}
              />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Lignes</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setLines((prev) => [...prev, emptyRow()])}
            >
              <Plus className="h-3 w-3" /> Ajouter une ligne
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-12 md:col-span-6">
                  <Field label={i === 0 ? 'Description' : ''} htmlFor={`desc-${i}`}>
                    <Input
                      id={`desc-${i}`}
                      value={line.description}
                      onChange={(e) => updateLine(i, { description: e.currentTarget.value })}
                      placeholder="Ex: Location 5 jours Renault Clio"
                      required
                    />
                  </Field>
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Field label={i === 0 ? 'Qté' : ''} htmlFor={`qty-${i}`}>
                    <Input
                      id={`qty-${i}`}
                      type="number"
                      step="0.01"
                      min={0.01}
                      value={line.quantity}
                      onChange={(e) => updateLine(i, { quantity: Number(e.currentTarget.value) || 0 })}
                    />
                  </Field>
                </div>
                <div className="col-span-5 md:col-span-2">
                  <Field label={i === 0 ? 'PU HT' : ''} htmlFor={`pu-${i}`}>
                    <Input
                      id={`pu-${i}`}
                      type="number"
                      step="0.01"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) => updateLine(i, { unitPrice: Number(e.currentTarget.value) || 0 })}
                    />
                  </Field>
                </div>
                <div className="col-span-2 md:col-span-1 text-right text-sm font-medium text-slate-700">
                  {(line.quantity * line.unitPrice).toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={lines.length === 1}
                    className="p-2 text-slate-400 hover:text-danger disabled:opacity-30"
                    aria-label="Supprimer la ligne"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody className="flex justify-end">
            <div className="w-full md:w-72 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Sous-total HT</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)} MAD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TVA ({taxRate.toFixed(2)}%)</span>
                <span className="font-medium">{totals.tax.toFixed(2)} MAD</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-900">Total TTC</span>
                <span className="font-semibold text-slate-900">{totals.total.toFixed(2)} MAD</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody>
            <Field label="Notes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} />
            </Field>
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
            Créer la facture
          </Button>
        </div>
      </form>
    </div>
  );
}
