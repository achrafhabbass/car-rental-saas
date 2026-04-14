import Link from 'next/link';
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarDays,
  FileText,
  CreditCard,
  Receipt,
  Wrench,
  Landmark,
  BarChart3,
  BellRing,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Véhicules', icon: Car },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/reservations', label: 'Réservations', icon: CalendarDays },
  { href: '/contracts', label: 'Contrats', icon: FileText },
  { href: '/invoices', label: 'Factures', icon: Receipt },
  { href: '/payments', label: 'Paiements', icon: CreditCard },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/credits', label: 'Crédits & Financement', icon: Landmark },
  { href: '/alerts', label: 'Alertes', icon: BellRing },
  { href: '/reports', label: 'Rapports', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-semibold text-slate-900">AutoSphere</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-primary-500 transition" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200">
        <div className="rounded-lg bg-primary-50 p-3">
          <p className="text-xs font-semibold text-primary-700">Essai gratuit</p>
          <p className="text-xs text-primary-600 mt-1">
            14 jours restants
          </p>
        </div>
      </div>
    </aside>
  );
}
