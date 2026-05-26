'use client';

import { ChevronDown, LogOut, Search } from 'lucide-react';
import { useState } from 'react';

import { NotificationsBell } from '@/components/layout/notifications-bell';
import { useAuth } from '@/lib/auth-context';

function initials(first?: string, last?: string): string {
  const a = (first ?? '').trim().charAt(0).toUpperCase();
  const b = (last ?? '').trim().charAt(0).toUpperCase();
  return (a + b) || 'AS';
}

export function Topbar() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="h-[78px] shrink-0 flex items-center gap-4 px-9 sticky top-0 z-30 bg-cream/85 backdrop-blur-xl border-b border-line">
      {/* Search */}
      <div className="flex-1 max-w-[520px] relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-ink-mute" />
        <input
          type="search"
          placeholder="Rechercher un véhicule, client, contrat…"
          className="w-full bg-paper border border-line rounded-2xl pl-11 pr-3 py-3 text-sm text-ink placeholder:text-ink-mute transition-shadow focus:outline-none focus:border-ember-500 focus:shadow-[0_0_0_4px_rgba(30,85,232,0.1)]"
        />
        <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center bg-cream-deep border border-line rounded-md px-1.5 py-0.5 text-[11px] font-mono text-ink-soft pointer-events-none">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2.5">
        {/* Reuse the existing live notifications bell — restyled by the
            new tokens so it inherits warm colors. */}
        <NotificationsBell />

        {/* User chip */}
        <div className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 bg-paper border border-line rounded-full cursor-pointer transition-colors hover:border-ember-500">
          <div className="w-8 h-8 rounded-full bg-grad-ember text-white grid place-items-center text-[13px] font-bold">
            {initials(user?.firstName, user?.lastName)}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-[13px] font-semibold text-ink">
              {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
            </p>
            <p className="text-[10px] font-semibold tracking-[0.08em] text-ink-mute">
              {user?.role ?? '—'}
            </p>
          </div>
          <ChevronDown className="hidden md:block h-3.5 w-3.5 text-ink-mute" />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-[42px] h-[42px] grid place-items-center bg-paper border border-line rounded-xl text-ink-soft hover:border-rose hover:text-rose transition-colors disabled:opacity-50"
          aria-label="Se déconnecter"
          title="Se déconnecter"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
