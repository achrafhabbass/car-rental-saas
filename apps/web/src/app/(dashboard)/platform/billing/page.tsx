'use client';

import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileDown,
  FileText,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge, Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { ApiError, downloadFile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { billingApi, platformApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';
import type {
  BillingSummaryDto,
  PlanDefinitionDto,
  SubscriptionInvoiceDto,
  SubscriptionPaymentDto,
  SubscriptionReceiptDto,
  TenantDto,
} from '@autosphere/shared';

function fmt(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'from-slate-500 to-slate-600',
  BUSINESS: 'from-blue-500 to-blue-600',
  ENTERPRISE: 'from-primary-500 to-primary-700',
};

export default function BillingPage() {
  const { hasRole } = useAuth();
  const toast = useToast();

  const [plans, setPlans] = useState<PlanDefinitionDto[]>([]);
  const [summary, setSummary] = useState<BillingSummaryDto | null>(null);
  const [payments, setPayments] = useState<SubscriptionPaymentDto[]>([]);
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoiceDto[]>([]);
  const [receipts, setReceipts] = useState<SubscriptionReceiptDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Payment form
  const [payOpen, setPayOpen] = useState(false);
  const [payTenantId, setPayTenantId] = useState('');
  const [payPlan, setPayPlan] = useState('STARTER');
  const [payPeriod, setPayPeriod] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('BANK_TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!hasRole('SUPER_ADMIN')) return;
    Promise.all([
      billingApi.plans(),
      billingApi.summary(),
      billingApi.payments(30),
      platformApi.listTenants({ pageSize: 200 }),
      billingApi.invoices(30),
      billingApi.receipts(30),
    ])
      .then(([p, s, pay, t, inv, rcp]) => {
        setPlans(p);
        setSummary(s);
        setPayments(pay);
        setTenants(t.items);
        setInvoices(inv);
        setReceipts(rcp);
      })
      .catch((err) => {
        if (err instanceof ApiError) setError(err.message);
      });
  }, [hasRole]);

  // Auto-set amount when plan/period changes
  useEffect(() => {
    const p = plans.find((pl) => pl.key === payPlan);
    if (p) setPayAmount(payPeriod === 'ANNUAL' ? p.priceAnnual : p.priceMonthly);
  }, [payPlan, payPeriod, plans]);

  async function recordPayment() {
    if (!payTenantId) {
      toast.error('Sélectionnez un tenant');
      return;
    }
    setPaying(true);
    try {
      await billingApi.recordPayment(payTenantId, {
        plan: payPlan,
        period: payPeriod,
        amount: payAmount,
        method: payMethod,
        reference: payRef || undefined,
      });
      toast.success('Paiement enregistré', 'Tenant activé/prolongé automatiquement');
      setPayOpen(false);
      setPayRef('');
      // Reload
      const [s, pay] = await Promise.all([billingApi.summary(), billingApi.payments(30)]);
      setSummary(s);
      setPayments(pay);
    } catch (err) {
      toast.error('Échec', err instanceof ApiError ? err.message : 'Erreur');
    } finally {
      setPaying(false);
    }
  }

  if (!hasRole('SUPER_ADMIN')) {
    return (
      <Card>
        <CardBody className="text-center py-12 text-sm text-slate-500">
          Section réservée aux super-administrateurs.
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-container">
      <PageHeader
        title="Facturation & abonnements"
        description="Gérez les plans, paiements et abonnements de tous les tenants."
        actions={
          <Button onClick={() => setPayOpen((v) => !v)}>
            <CreditCard className="h-4 w-4" />
            Enregistrer un paiement
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Revenus total', value: `${fmt(summary.totalRevenue)} MAD`, icon: DollarSign },
            { label: 'Revenus ce mois', value: `${fmt(summary.revenueThisMonth)} MAD`, icon: TrendingUp },
            { label: 'Paiements enregistrés', value: fmt(summary.paymentCount), icon: CreditCard },
            { label: 'Paiement moyen', value: `${fmt(summary.avgPayment)} MAD`, icon: Star },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardBody className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <kpi.icon className="h-4 w-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{kpi.label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{kpi.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.key} className="overflow-hidden">
            <div className={`bg-gradient-to-r ${PLAN_COLORS[p.key] ?? 'from-slate-500 to-slate-600'} px-5 py-4`}>
              <h3 className="text-lg font-bold text-white">{p.name}</h3>
              <p className="text-xs text-white/70">{p.description}</p>
            </div>
            <CardBody className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{fmt(p.priceMonthly)}</span>
                <span className="text-sm text-slate-500">MAD / mois</span>
              </div>
              <p className="text-xs text-slate-400">
                ou {fmt(p.priceAnnual)} MAD/an ({Math.round((1 - p.priceAnnual / (p.priceMonthly * 12)) * 100)}% économie)
              </p>
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Limites</p>
                <p className="text-sm text-slate-700">
                  {p.maxVehicles ? `${p.maxVehicles} véhicules` : 'Véhicules illimités'}
                  {' · '}
                  {p.maxUsers ? `${p.maxUsers} utilisateurs` : 'Utilisateurs illimités'}
                </p>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                {p.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Payment form */}
      {payOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Enregistrer un paiement d'abonnement</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Tenant" htmlFor="payTenant" required>
              <Select id="payTenant" value={payTenantId} onChange={(e) => { const v = e.target.value; setPayTenantId(v); }}>
                <option value="">— Sélectionner —</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Plan" htmlFor="payPlan">
              <Select id="payPlan" value={payPlan} onChange={(e) => { const v = e.target.value; setPayPlan(v); }}>
                {plans.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name} — {fmt(p.priceMonthly)} MAD/mois
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Période" htmlFor="payPeriod">
              <Select id="payPeriod" value={payPeriod} onChange={(e) => { const v = e.target.value as 'MONTHLY' | 'ANNUAL'; setPayPeriod(v); }}>
                <option value="MONTHLY">Mensuel</option>
                <option value="ANNUAL">Annuel</option>
              </Select>
            </Field>
            <Field label="Montant (MAD)" htmlFor="payAmount">
              <Input id="payAmount" type="number" min={0} step="0.01" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Mode de paiement" htmlFor="payMethod">
              <Select id="payMethod" value={payMethod} onChange={(e) => { const v = e.target.value; setPayMethod(v); }}>
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="CASH">Espèces</option>
                <option value="CHECK">Chèque</option>
                <option value="CARD">Carte bancaire</option>
              </Select>
            </Field>
            <Field label="Référence (optionnel)" htmlFor="payRef">
              <Input id="payRef" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="N° transaction" />
            </Field>
            <div className="md:col-span-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayOpen(false)}>
                Annuler
              </Button>
              <Button onClick={recordPayment} loading={paying}>
                <CreditCard className="h-4 w-4" />
                Enregistrer et activer
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <Badge tone="slate">{payments.length} derniers</Badge>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Tenant</Th>
                <Th>Plan</Th>
                <Th>Période</Th>
                <Th>Montant</Th>
                <Th>Mode</Th>
                <Th>Fin abo.</Th>
              </Tr>
            </Thead>
            <Tbody>
              {payments.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-400 py-6">
                    Aucun paiement enregistré.
                  </Td>
                </Tr>
              ) : (
                payments.map((p) => (
                  <Tr key={p.id}>
                    <Td className="whitespace-nowrap">{formatDate(p.paidAt)}</Td>
                    <Td className="font-medium">{p.tenant?.name ?? '—'}</Td>
                    <Td>
                      <Badge tone="blue">{p.plan}</Badge>
                    </Td>
                    <Td>{p.period === 'ANNUAL' ? 'Annuel' : 'Mensuel'}</Td>
                    <Td className="font-semibold">{fmt(Number(p.amount))} MAD</Td>
                    <Td>{p.method}</Td>
                    <Td className="whitespace-nowrap">{formatDate(p.endDate)}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-500" />
            Factures d'abonnement
          </CardTitle>
          <Badge tone="slate">{invoices.length} dernières</Badge>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>N° Facture</Th>
                <Th>Tenant</Th>
                <Th>Plan</Th>
                <Th>Montant HT</Th>
                <Th>TVA</Th>
                <Th>Total TTC</Th>
                <Th>Date</Th>
                <Th>PDF</Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoices.length === 0 ? (
                <Tr>
                  <Td colSpan={8} className="text-center text-slate-400 py-6">
                    Aucune facture. Les factures sont générées automatiquement
                    après chaque paiement.
                  </Td>
                </Tr>
              ) : (
                invoices.map((inv) => (
                  <Tr key={inv.id}>
                    <Td className="font-mono text-xs font-semibold">{inv.invoiceNumber}</Td>
                    <Td className="font-medium">{inv.tenant?.name ?? '—'}</Td>
                    <Td>
                      <Badge tone="blue">{inv.payment?.plan ?? '—'}</Badge>
                    </Td>
                    <Td>{fmt(Number(inv.amount))} MAD</Td>
                    <Td className="text-slate-500">{fmt(Number(inv.taxAmount))} MAD</Td>
                    <Td className="font-semibold">{fmt(Number(inv.totalTtc))} MAD</Td>
                    <Td className="whitespace-nowrap">{formatDate(inv.issuedAt)}</Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          downloadFile(
                            billingApi.invoicePdfPath(inv.id),
                            `${inv.invoiceNumber}.pdf`,
                          )
                        }
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Receipts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary-500" />
            Reçus de paiement
          </CardTitle>
          <Badge tone="slate">{receipts.length} derniers</Badge>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>N° Reçu</Th>
                <Th>Tenant</Th>
                <Th>Montant</Th>
                <Th>Mode</Th>
                <Th>Référence</Th>
                <Th>Date</Th>
                <Th>PDF</Th>
              </Tr>
            </Thead>
            <Tbody>
              {receipts.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-400 py-6">
                    Aucun reçu. Les reçus sont générés automatiquement.
                  </Td>
                </Tr>
              ) : (
                receipts.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-mono text-xs font-semibold">{r.receiptNumber}</Td>
                    <Td className="font-medium">{r.tenant?.name ?? '—'}</Td>
                    <Td className="font-semibold">{fmt(Number(r.amount))} MAD</Td>
                    <Td>{r.method}</Td>
                    <Td className="text-slate-500">{r.reference ?? '—'}</Td>
                    <Td className="whitespace-nowrap">{formatDate(r.issuedAt)}</Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          downloadFile(
                            billingApi.receiptPdfPath(r.id),
                            `${r.receiptNumber}.pdf`,
                          )
                        }
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
