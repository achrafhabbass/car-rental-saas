import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AutoSphere — Plateforme SaaS de gestion de location de voitures',
  description:
    'Gérez votre flotte, vos réservations, contrats et factures dans une seule plateforme cloud. Essai gratuit 14 jours.',
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
