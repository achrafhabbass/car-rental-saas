'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { authApi } from '@/lib/resources';
import { session } from '@/lib/session';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const companyName = String(fd.get('companyName'));
    try {
      const result = await authApi.register({
        companyName,
        companySlug: slugify(companyName) || 'company',
        firstName: String(fd.get('firstName')),
        lastName: String(fd.get('lastName')),
        email: String(fd.get('email')),
        password: String(fd.get('password')),
      });
      session.set({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tenantId: result.tenantId,
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inscription échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Créer votre espace</h2>
      <p className="mt-1 text-sm text-slate-500">
        14 jours d'essai gratuit · aucune carte bancaire requise.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <Field label="Nom de l'entreprise" htmlFor="companyName" required>
          <Input id="companyName" name="companyName" required minLength={2} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom" htmlFor="firstName" required>
            <Input id="firstName" name="firstName" required />
          </Field>
          <Field label="Nom" htmlFor="lastName" required>
            <Input id="lastName" name="lastName" required />
          </Field>
        </div>

        <Field label="Adresse email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required />
        </Field>

        <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum." required>
          <Input id="password" name="password" type="password" required minLength={8} />
        </Field>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Créer mon compte
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-secondary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
