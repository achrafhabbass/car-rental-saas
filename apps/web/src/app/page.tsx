import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="inline-block rounded-full bg-primary-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700 mb-6">
          SaaS · Car rental management
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-primary-700 tracking-tight">
          AutoSphere
        </h1>
        <p className="mt-6 text-lg text-slate-600 leading-relaxed">
          Plateforme multi-tenant de gestion opérationnelle et financière pour les
          sociétés de location de voitures.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}
