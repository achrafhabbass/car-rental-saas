'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from './api';
import { useAuth } from './auth-context';
import { dashboardApi } from './resources';

export interface BadgesState {
  alerts: number;
  reservationsToday: number;
  contractsOverdue: number;
}

const REFRESH_MS = 60_000;
const ZERO: BadgesState = { alerts: 0, reservationsToday: 0, contractsOverdue: 0 };

const BadgesContext = createContext<BadgesState>(ZERO);

export function BadgesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [badges, setBadges] = useState<BadgesState>(ZERO);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const r = await dashboardApi.badges();
      setBadges(r);
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        // 401 is handled by the auth-context refresh interceptor; ignore.
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setBadges(ZERO);
      return;
    }
    void refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, refresh]);

  const value = useMemo(() => badges, [badges]);
  return <BadgesContext.Provider value={value}>{children}</BadgesContext.Provider>;
}

export function useBadges(): BadgesState {
  return useContext(BadgesContext);
}
