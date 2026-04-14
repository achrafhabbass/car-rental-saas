'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get('email')), String(fd.get('password')));
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Se connecter</h2>
      <p className="mt-1 text-sm text-slate-500">
        Accédez à votre espace de gestion AutoSphere.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <Field label="Adresse email" htmlFor="email" required>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@entreprise.ma" />
        </Field>
        <Field label="Mot de passe" htmlFor="password" required>
          <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="••••••••" />
        </Field>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-medium text-secondary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
