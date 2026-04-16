'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth-context';

/**
 * Wraps children with an authentication gate.
 * - While hydrating, renders a minimal loading state (so we don't flash
 *   protected content to an unauthenticated user on first paint).
 * - On hydration complete + no user, redirects to /login and renders null.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

/**
 * Redirects authenticated users to /dashboard when they hit auth pages.
 * Render this inside the (auth) layout to prevent logged-in users from
 * seeing /login or /register.
 */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  return <>{children}</>;
}
