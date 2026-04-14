export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-50">
      <section className="hidden md:flex flex-col justify-between p-12 bg-primary-500 text-white">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AutoSphere</h1>
          <p className="mt-2 text-primary-100 text-sm">
            Car rental management SaaS
          </p>
        </div>
        <blockquote className="text-lg leading-relaxed text-primary-50">
          « Centralisez l'ensemble de votre activité de location — véhicules,
          clients, contrats, crédits — dans une seule interface. »
        </blockquote>
        <p className="text-xs text-primary-200">
          © {new Date().getFullYear()} AutoSphere · Tous droits réservés
        </p>
      </section>
      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
