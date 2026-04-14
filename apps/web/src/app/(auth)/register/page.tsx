import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Créer votre espace</h2>
      <p className="mt-1 text-sm text-slate-500">
        14 jours d'essai gratuit · aucune carte bancaire requise.
      </p>

      <form className="mt-8 space-y-5" action="#" method="post">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-slate-700">
            Nom de l'entreprise
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
              Prénom
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
              Nom
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <p className="mt-1 text-xs text-slate-400">8 caractères minimum.</p>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition"
        >
          Créer mon compte
        </button>
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
