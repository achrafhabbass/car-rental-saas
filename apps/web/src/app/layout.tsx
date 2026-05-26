import type { Metadata } from 'next';
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';

import { SentryInit } from '@/components/sentry-init';
import { AuthProvider } from '@/lib/auth-context';
import { BadgesProvider } from '@/lib/badges-context';
import { ToastProvider } from '@/lib/toast-context';
import './globals.css';

// Three faces — bound to CSS variables so Tailwind's font utilities resolve
// without per-file imports.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AutoSphere SaaS',
  description: 'Plateforme SaaS de gestion de location de voitures',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body>
        <SentryInit />
        <AuthProvider>
          <BadgesProvider>
            <ToastProvider>{children}</ToastProvider>
          </BadgesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
