'use client';

import { Bell, LogOut, Search } from 'lucide-react';
import { useState } from 'react';

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
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white flex items-center gap-4 px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Rechercher un véhicule, client, contrat…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center">
            {initials(user?.firstName, user?.lastName)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
            </p>
            <p className="text-xs text-slate-500 leading-tight">{user?.role ?? '—'}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-danger transition disabled:opacity-50"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
