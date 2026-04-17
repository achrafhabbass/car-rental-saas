'use client';

import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { AuthInput } from '@/components/auth/auth-input';
import { Button } from '@/components/ui/button';
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
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Connexion échouée');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Mobile brand (lg:hidden) */}
      <div className="lg:hidden flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center text-white font-bold shadow-md">
          A
        </div>
        <div>
          <p className="font-bold text-slate-900">AutoSphere</p>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">
            Car Rental · SaaS
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-700 ring-1 ring-primary-100">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Plateforme sécurisée
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Se connecter à votre compte
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Reprenez la main sur votre flotte, vos clients et vos contrats.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Adresse email"
          icon={Mail}
          autoComplete="email"
          required
          placeholder="vous@entreprise.ma"
        />
        <AuthInput
          id="password"
          name="password"
          label="Mot de passe"
          icon={Lock}
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="••••••••"
          togglePassword
        />

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500/30"
            />
            <span className="text-slate-600">Se souvenir de moi</span>
          </label>
          <Link
            href="/forgot-password"
            className="font-medium text-secondary hover:text-primary-600 hover:underline underline-offset-2"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700 animate-fade-up"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          size="lg"
          className="w-full group bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20"
        >
          <span>Se connecter</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </form>

      <p className="mt-10 text-center text-sm text-slate-400">
        Contactez votre administrateur pour obtenir un accès.
      </p>
    </div>
  );
}
