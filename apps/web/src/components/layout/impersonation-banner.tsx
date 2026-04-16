'use client';

import { LogOut, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  exitImpersonation,
  getImpersonationContext,
  type ImpersonationContext,
} from '@/lib/impersonation';
import { useToast } from '@/lib/toast-context';

/**
 * Persistent warning banner shown above the dashboard while a super-admin
 * is impersonating a tenant. The "Return to platform" button restores the
 * original session tokens and redirects back to the platform tenants list.
 */
export function ImpersonationBanner() {
  const router = useRouter();
  const toast = useToast();
  const [ctx, setCtx] = useState<ImpersonationContext | null>(null);

  useEffect(() => {
    setCtx(getImpersonationContext());
  }, []);

  if (!ctx) return null;

  function onReturn() {
    const ok = exitImpersonation();
    if (!ok) {
      toast.error('Session super-admin introuvable');
      return;
    }
    toast.info('Retour au panneau plateforme');
    router.replace('/platform/tenants');
    router.refresh();
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-sm flex items-center gap-3">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Vous êtes connecté en tant que{' '}
        <strong>
          {ctx.impersonatedUser.firstName} {ctx.impersonatedUser.lastName}
        </strong>{' '}
        · tenant <strong>{ctx.tenantName}</strong>. Toute action est
        auditée.
      </span>
      <button
        type="button"
        onClick={onReturn}
        className="inline-flex items-center gap-1 rounded bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-semibold transition"
      >
        <LogOut className="h-3 w-3" />
        Retour plateforme
      </button>
    </div>
  );
}
