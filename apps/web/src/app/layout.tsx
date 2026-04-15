import type { Metadata } from 'next';

import { AuthProvider } from '@/lib/auth-context';
import { BadgesProvider } from '@/lib/badges-context';
import { ToastProvider } from '@/lib/toast-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoSphere SaaS',
  description: 'Plateforme SaaS de gestion de location de voitures',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <BadgesProvider>
            <ToastProvider>{children}</ToastProvider>
          </BadgesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
