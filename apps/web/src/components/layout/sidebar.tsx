'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ClipboardCheck,
  CalendarRange,
  ScrollText,
  ShieldCheck,
  Settings,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { useBadges } from '@/lib/badges-context';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /// Key into the badges context used to render a counter pill.
  badgeKey?: 'alerts' | 'reservationsToday' | 'contractsOverdue';
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    items: [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }],
  },
  {
    title: 'Opérations',
    items: [
      { href: '/vehicles', label: 'Véhicules', icon: Car },
      { href: '/clients', label: 'Clients', icon: Users },
      {
        href: '/reservations',
        label: 'Réservations',
        icon: CalendarDays,
        badgeKey: 'reservationsToday',
      },
      {
        href: '/contracts',
        label: 'Contrats',
        icon: FileText,
        badgeKey: 'contractsOverdue',
      },
      { href: '/calendar', label: 'Calendrier', icon: CalendarRange },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/invoices', label: 'Factures', icon: Receipt },
      { href: '/payments', label: 'Paiements', icon: CreditCard },
      { href: '/credits', label: 'Crédits & Financement', icon: Landmark },
    ],
  },
  {
    title: 'Support',
    items: [
      { href: '/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/inspections', label: 'Inspections', icon: ClipboardCheck },
      { href: '/alerts', label: 'Alertes', icon: BellRing, badgeKey: 'alerts' },
      { href: '/reports', label: 'Rapports', icon: BarChart3 },
    ],
  },
  {
    title: 'Système',
    items: [
      { href: '/team', label: 'Équipe', icon: Users },
      { href: '/settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

const PLATFORM_ITEMS: NavItem[] = [
  { href: '/platform', label: 'Vue plateforme', icon: ShieldCheck },
  { href: '/platform/tenants', label: 'Tenants', icon: Users },
  { href: '/platform/billing', label: 'Facturation', icon: CreditCard },
  { href: '/platform/audit', label: "Journal d'audit", icon: ScrollText },
  { href: '/platform/system', label: 'Système', icon: Settings },
];

function CountBadge({ count, tone }: { count: number; tone: 'red' | 'amber' | 'blue' }) {
  if (count <= 0) return null;
  const palette: Record<string, string> = {
    red: 'bg-danger text-white',
    amber: 'bg-amber-500 text-white',
    blue: 'bg-secondary text-white',
  };
  return (
    <span
      className={cn(
        'ml-auto inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold min-w-[18px] h-[18px]',
        palette[tone],
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const badges = useBadges();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderItem({ href, label, icon: Icon, badgeKey }: NavItem) {
    const active = isActive(href);
    const count = badgeKey ? badges[badgeKey] : 0;
    const tone: 'red' | 'amber' | 'blue' =
      badgeKey === 'contractsOverdue' ? 'red' : badgeKey === 'alerts' ? 'amber' : 'blue';
    return (
      <li key={href}>
        <Link
          href={href}
          className={cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
            active
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 transition',
              active ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-500',
            )}
          />
          <span className="flex-1">{label}</span>
          {badgeKey ? <CountBadge count={count} tone={tone} /> : null}
        </Link>
      </li>
    );
  }

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
        {SECTIONS.map((section, idx) => (
          <div key={idx} className={idx === 0 ? '' : 'mt-5'}>
            {section.title && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">{section.items.map(renderItem)}</ul>
            {idx < SECTIONS.length - 1 && (
              <div className="mt-4 mx-3 border-b border-slate-100" />
            )}
          </div>
        ))}

        {isSuperAdmin && (
          <div className="mt-5">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Platform
            </p>
            <ul className="space-y-0.5">{PLATFORM_ITEMS.map(renderItem)}</ul>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="rounded-lg bg-primary-50 p-3">
          <p className="text-xs font-semibold text-primary-700">
            {isSuperAdmin ? 'Super-admin' : 'Espace pro'}
          </p>
          <p className="text-xs text-primary-600 mt-1">
            {isSuperAdmin ? 'Accès plateforme' : `Connecté en tant que ${user?.role ?? '—'}`}
          </p>
        </div>
      </div>
    </aside>
  );
}
