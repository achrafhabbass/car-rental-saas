'use client';

import {
  AlertCircle,
  ArrowRight,
  Building2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

import { AuthInput } from '@/components/auth/auth-input';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function passwordScore(pw: string): { score: number; label: string; tone: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const scales = [
    { label: 'Trop faible', tone: 'bg-red-400' },
    { label: 'Faible', tone: 'bg-orange-400' },
    { label: 'Correct', tone: 'bg-amber-400' },
    { label: 'Solide', tone: 'bg-emerald-400' },
    { label: 'Excellent', tone: 'bg-emerald-500' },
    { label: 'Excellent', tone: 'bg-emerald-500' },
  ];
  return { score: s, ...scales[s] };
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const pw = useMemo(() => passwordScore(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (mismatch) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const companyName = String(fd.get('companyName'));
    const fullName = String(fd.get('fullName')).trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(' ') || firstName;
    try {
      await register({
        companyName,
        companySlug: slugify(companyName) || 'company',
        firstName,
        lastName,
        email: String(fd.get('email')),
        password: String(fd.get('password')),
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
      {/* Mobile brand */}
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

      <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-accent/20">
        <ShieldCheck className="h-3 w-3" />
        14 jours d'essai gratuit
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Créer votre espace
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Aucune carte bancaire requise. Annulez à tout moment.
      </p>

      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <AuthInput
          id="companyName"
          name="companyName"
          label="Nom de l'entreprise"
          icon={Building2}
          required
          minLength={2}
          placeholder="Giyu Location"
        />

        <AuthInput
          id="fullName"
          name="fullName"
          label="Nom complet"
          icon={User}
          required
          autoComplete="name"
          placeholder="Achraf Habbass"
        />

        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Adresse email"
          icon={Mail}
          required
          autoComplete="email"
          placeholder="vous@entreprise.ma"
        />

        <AuthInput
          id="phone"
          name="phone"
          type="tel"
          label="Téléphone"
          icon={Phone}
          autoComplete="tel"
          placeholder="+212 6 00 00 00 00"
        />

        <div>
          <AuthInput
            id="password"
            name="password"
            label="Mot de passe"
            icon={Lock}
            required
            minLength={8}
            placeholder="••••••••"
            togglePassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < pw.score ? pw.tone : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Force : <span className="font-semibold">{pw.label}</span> · 8 caractères minimum
              </p>
            </div>
          )}
        </div>

        <AuthInput
          id="confirm"
          label="Confirmation du mot de passe"
          icon={Lock}
          required
          minLength={8}
          placeholder="••••••••"
          togglePassword
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? 'Les mots de passe ne correspondent pas.' : undefined}
        />

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
          className="w-full group bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/20 mt-2"
        >
          <span>Créer mon compte</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          En créant un compte, vous acceptez nos{' '}
          <Link href="#" className="underline hover:text-slate-600">
            conditions d'utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="#" className="underline hover:text-slate-600">
            politique de confidentialité
          </Link>
          .
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Vous avez déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-semibold text-secondary hover:underline underline-offset-2"
        >
          Se connecter →
        </Link>
      </p>
    </div>
  );
}
