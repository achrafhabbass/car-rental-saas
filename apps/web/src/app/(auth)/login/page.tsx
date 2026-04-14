import Link from 'next/link';

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Se connecter</h2>
      <p className="mt-1 text-sm text-slate-500">
        Accédez à votre espace de gestion AutoSphere.
      </p>

      <form className="mt-8 space-y-5" action="#" method="post">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="vous@entreprise.ma"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <Link href="/forgot-password" className="text-xs text-secondary hover:underline">
              Oublié ?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition"
        >
          Se connecter
        </button>
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
