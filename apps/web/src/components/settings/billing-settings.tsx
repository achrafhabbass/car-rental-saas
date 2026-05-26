'use client';

import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { stripeApi } from '@/lib/resources';
import { useToast } from '@/lib/toast-context';

type Plan = 'STARTER' | 'BUSINESS';
type Period = 'monthly' | 'annual';

const PLAN_CARDS: Array<{
  plan: Plan;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
  features: string[];
}> = [
  {
    plan: 'STARTER',
    name: 'Basic',
    description: 'Idéal pour les petites agences',
    priceMonthly: 300,
    priceAnnual: 3000,
    features: ['10 véhicules', '3 utilisateurs', 'Réservations & contrats', 'Alertes maintenance'],
  },
  {
    plan: 'BUSINESS',
    name: 'Pro',
    description: 'Pour les agences en croissance',
    priceMonthly: 500,
    priceAnnual: 5000,
    popular: true,
    features: ['50 véhicules', '10 utilisateurs', 'Inspections', 'Rapports avancés', 'Export PDF & Excel'],
  },
];

/**
 * Billing section of the settings page.
 *
 * - Lists public plans with monthly/annual toggle.
 * - "Souscrire" creates a Stripe Checkout session and redirects.
 * - "Gérer mon abonnement" opens the Stripe Customer Portal — only
 *   shown once a tenant has a Stripe customer (i.e. completed checkout
 *   at least once).
 */
export function BillingSettings() {
  const { user } = useAuth();
  const toast = useToast();
  const [period, setPeriod] = useState<Period>('annual');
  const [busyPlan, setBusyPlan] = useState<Plan | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const tenant = user?.tenant;
  const hasStripeCustomer = Boolean(
    (tenant as unknown as { stripeCustomerId?: string | null } | null | undefined)
      ?.stripeCustomerId,
  );

  async function startCheckout(plan: Plan): Promise<void> {
    setBusyPlan(plan);
    try {
      const { url } = await stripeApi.checkout({ plan, period });
      window.location.href = url;
    } catch (err) {
      toast.error(
        'Impossible de démarrer le paiement',
        err instanceof ApiError ? err.message : 'Erreur inconnue',
      );
      setBusyPlan(null);
    }
  }

  async function openPortal(): Promise<void> {
    setOpeningPortal(true);
    try {
      const { url } = await stripeApi.portal();
      window.location.href = url;
    } catch (err) {
      toast.error(
        'Impossible d\'ouvrir le portail',
        err instanceof ApiError ? err.message : 'Erreur inconnue',
      );
      setOpeningPortal(false);
    }
  }

  if (!tenant) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-500">
            Aucune entreprise rattachée à votre compte.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary-500" />
            Abonnement
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-sm text-slate-700">
            Plan actuel :{' '}
            <strong className="text-slate-900">{tenant.plan ?? '—'}</strong> · statut{' '}
            <strong className="text-slate-900">{tenant.status}</strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Période :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                className={`rounded-md px-3 py-1 transition ${
                  period === 'monthly'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setPeriod('monthly')}
              >
                Mensuel
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1 transition ${
                  period === 'annual'
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setPeriod('annual')}
              >
                Annuel (≈ 2 mois offerts)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLAN_CARDS.map((p) => {
              const price = period === 'annual' ? p.priceAnnual : p.priceMonthly;
              const isCurrent = tenant.plan === p.plan;
              return (
                <div
                  key={p.plan}
                  className={`rounded-xl border p-5 ${
                    p.popular
                      ? 'border-primary-200 bg-primary-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {p.name}
                      </p>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-900">
                          {price.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-xs text-slate-500">
                          MAD/{period === 'annual' ? 'an' : 'mois'}
                        </span>
                      </div>
                    </div>
                    {p.popular && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Populaire
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{p.description}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                    {p.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    className="mt-4 w-full"
                    variant={isCurrent ? 'secondary' : 'primary'}
                    disabled={busyPlan !== null}
                    onClick={() => startCheckout(p.plan)}
                  >
                    {busyPlan === p.plan && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    {isCurrent ? 'Renouveler / mettre à niveau' : 'Souscrire'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {hasStripeCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary-500" />
              Gérer mon abonnement
            </CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-slate-700">
              Ouvrez le portail Stripe pour modifier votre carte, télécharger vos
              factures, changer de plan ou annuler votre abonnement.
            </p>
            <Button onClick={openPortal} disabled={openingPortal}>
              {openingPortal && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              <ExternalLink className="h-4 w-4" />
              Ouvrir le portail Stripe
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
