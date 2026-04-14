'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { ApiError } from '@/lib/api';
import { creditsApi, vehiclesApi } from '@/lib/resources';
import type { VehicleDto } from '@autosphere/shared';

/// Preview monthly payment using the standard amortization formula.
function previewMonthly(principal: number, annualRatePct: number, termMonths: number): number {
  if (termMonths <= 0 || principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

export default function NewCreditPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [principal, setPrincipal] = useState(100000);
  const [downPayment, setDownPayment] = useState(0);
  const [interestRate, setInterestRate] = useState(7.5);
  const [termMonths, setTermMonths] = useState(60);
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

  const monthly = useMemo(
    () => previewMonthly(principal - downPayment, interestRate, termMonths),
    [principal, downPayment, interestRate, termMonths],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await creditsApi.create({
        vehicleId: String(fd.get('vehicleId')),
        bankName: String(fd.get('bankName')),
        accountNumber: String(fd.get('accountNumber') || '') || undefined,
        creditType: (String(fd.get('creditType')) as 'BANK_CREDIT' | 'LEASING') || undefined,
        principal,
        downPayment,
        interestRate,
        termMonths,
        residualValue: fd.get('residualValue') ? Number(fd.get('residualValue')) : undefined,
        startDate: new Date(String(fd.get('startDate'))).toISOString(),
        notes: String(fd.get('notes') || '') || undefined,
      });
      router.push('/credits');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Création échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Nouveau crédit" description="Enregistrer un crédit bancaire ou un leasing" />

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Véhicule & banque</CardTitle>
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
            <Field label="Type de financement" htmlFor="creditType">
              <Select id="creditType" name="creditType" defaultValue="BANK_CREDIT">
                <option value="BANK_CREDIT">Crédit bancaire</option>
                <option value="LEASING">Leasing</option>
              </Select>
            </Field>
            <Field label="Banque" htmlFor="bankName" required>
              <Input id="bankName" name="bankName" required />
            </Field>
            <Field label="N° de compte/dossier" htmlFor="accountNumber">
              <Input id="accountNumber" name="accountNumber" />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Conditions financières</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Montant total (MAD)" htmlFor="principal" required>
              <Input
                id="principal"
                name="principal"
                type="number"
                step="0.01"
                min={0.01}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.currentTarget.value) || 0)}
                required
              />
            </Field>
            <Field label="Apport / acompte (MAD)" htmlFor="downPayment">
              <Input
                id="downPayment"
                name="downPayment"
                type="number"
                step="0.01"
                min={0}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.currentTarget.value) || 0)}
              />
            </Field>
            <Field label="Taux d'intérêt annuel (%)" htmlFor="interestRate" required>
              <Input
                id="interestRate"
                name="interestRate"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.currentTarget.value) || 0)}
                required
              />
            </Field>
            <Field label="Durée (mois)" htmlFor="termMonths" required>
              <Input
                id="termMonths"
                name="termMonths"
                type="number"
                min={1}
                max={600}
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.currentTarget.value) || 0)}
                required
              />
            </Field>
            <Field label="Date de début" htmlFor="startDate" required>
              <Input id="startDate" name="startDate" type="date" required />
            </Field>
            <Field label="Valeur résiduelle (leasing)" htmlFor="residualValue">
              <Input id="residualValue" name="residualValue" type="number" step="0.01" min={0} />
            </Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Mensualité estimée
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {monthly.toFixed(2)} MAD
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Calculée avec la formule d'amortissement classique (France)
              </p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Financé : <span className="font-medium text-slate-900">{(principal - downPayment).toFixed(2)} MAD</span></p>
              <p>Coût total : <span className="font-medium text-slate-900">{(monthly * termMonths).toFixed(2)} MAD</span></p>
              <p>Intérêts : <span className="font-medium text-slate-900">{(monthly * termMonths - (principal - downPayment)).toFixed(2)} MAD</span></p>
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
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
