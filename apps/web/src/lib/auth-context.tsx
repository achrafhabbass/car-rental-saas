'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AuthProfileDto, UserRoleName } from '@autosphere/shared';

import { ApiError, setOnUnauthorized } from './api';
import { authApi } from './resources';
import { session, type StoredSession } from './session';

export interface AuthContextValue {
  user: AuthProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthProfileDto>;
  register: (input: {
    companyName: string;
    companySlug: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<AuthProfileDto>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthProfileDto | null>;
  hasRole: (...roles: UserRoleName[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const finalizeSession = useCallback((next: StoredSession & { user: AuthProfileDto | null }) => {
    session.set(next);
    setUser(next.user);
  }, []);

  const clearSession = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  // Hydrate from storage + verify token is still valid via /me
  useEffect(() => {
    const cached = session.getUser();
    if (cached) setUser(cached);

    const token = session.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((fresh) => {
        session.setUser(fresh);
        setUser(fresh);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setIsLoading(false));
  }, [clearSession]);

  // When the api client gives up refreshing, redirect to /login
  useEffect(() => {
    setOnUnauthorized(() => {
      clearSession();
      router.replace('/login');
    });
    return () => setOnUnauthorized(null);
  }, [clearSession, router]);

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      const result = await authApi.login({ email, password });
      session.setTokens({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tenantId: result.tenantId,
      });
      const profile = await authApi.me();
      finalizeSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tenantId: result.tenantId,
        user: profile,
      });
      return profile;
    },
    [finalizeSession],
  );

  const register = useCallback<AuthContextValue['register']>(
    async () => {
      throw new Error('Public registration is disabled. Contact your administrator.');
    },
    [],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      if (!(err instanceof ApiError) || err.status >= 500) {
        // logging errors beyond 401 (already invalidated) bubble up silently
      }
    } finally {
      clearSession();
      router.replace('/login');
    }
  }, [clearSession, router]);

  const refreshUser = useCallback<AuthContextValue['refreshUser']>(async () => {
    if (!session.getAccessToken()) return null;
    try {
      const fresh = await authApi.me();
      session.setUser(fresh);
      setUser(fresh);
      return fresh;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  const hasRole = useCallback<AuthContextValue['hasRole']>(
    (...roles) => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      hasRole,
    }),
    [user, isLoading, login, register, logout, refreshUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
