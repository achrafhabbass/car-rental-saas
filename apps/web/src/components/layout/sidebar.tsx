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
  badgeKey?: 'alerts' | 'reservationsToday' | 'contractsOverdue';
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  { items: [{ href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard }] },
  {
    title: 'Opérations',
    items: [
      { href: '/vehicles', label: 'Véhicules', icon: Car },
      { href: '/clients', label: 'Clients', icon: Users },
      { href: '/reservations', label: 'Réservations', icon: CalendarDays, badgeKey: 'reservationsToday' },
      { href: '/contracts', label: 'Contrats', icon: FileText, badgeKey: 'contractsOverdue' },
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

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-lg bg-ember-500 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px]">
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
    return (
      <li key={href}>
        <Link
          href={href}
          className={cn(
            'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
            active
              ? // Active = ember gradient pill + left rail. Matches the
                // mockup's `.nav-item.active` exactly.
                'bg-gradient-to-r from-ember-500/95 to-ember-600/85 text-white shadow-[0_8px_18px_-8px_rgba(30,85,232,0.7)]'
              : 'text-white/65 hover:bg-white/5 hover:text-white',
          )}
        >
          {active && (
            <span className="absolute -left-5 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-ember-glow rounded-r" />
          )}
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className="flex-1">{label}</span>
          {badgeKey && (
            <span
              className={cn(
                'ml-auto inline-flex items-center justify-center rounded-lg text-[10px] font-bold px-1.5 py-0.5 min-w-[18px]',
                active ? 'bg-white/25 text-white' : 'bg-ember-500 text-white',
              )}
            >
              {count > 0 ? (count > 99 ? '99+' : count) : null}
            </span>
          )}
          {!badgeKey && null}
          {badgeKey && count === 0 && (
            <CountBadge count={0} /> /* invisible — keeps spacing */
          )}
        </Link>
      </li>
    );
  }

  return (
    <aside
      className="hidden lg:flex lg:flex-col w-[280px] shrink-0 text-white relative overflow-hidden"
      style={{ backgroundColor: '#161A2C' }}
    >
      {/* Decorative warm glow blooms — pulled from the mockup's `::before`
          on `.sidebar`. Ember at top-left, soft glow at bottom-right. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, rgba(30,85,232,0.18), transparent 50%), radial-gradient(circle at 80% 100%, rgba(91,141,239,0.08), transparent 50%)',
        }}
      />

      <div className="relative">
        {/* Brand */}
        <div className="px-7 pt-7 pb-7 flex items-center gap-3 border-b border-white/10 mx-5">
          <div className="relative w-10 h-10 rounded-xl bg-grad-ember grid place-items-center shadow-[0_8px_20px_-4px_rgba(30,85,232,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display text-[22px] font-semibold tracking-tight leading-none">
              AutoSphere
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-medium mt-1">
              Fleet Platform
            </p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto py-5 px-5 scrollbar-thin">
        {SECTIONS.map((section, idx) => (
          <div key={idx} className={idx === 0 ? '' : 'mt-6'}>
            {section.title && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 px-3 mb-2.5">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">{section.items.map(renderItem)}</ul>
          </div>
        ))}

        {isSuperAdmin && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ember-glow/70 px-3 mb-2.5">
              Platform
            </p>
            <ul className="space-y-0.5">{PLATFORM_ITEMS.map(renderItem)}</ul>
          </div>
        )}
      </nav>
    </aside>
  );
}
