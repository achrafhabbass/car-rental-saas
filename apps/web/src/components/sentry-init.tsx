'use client';

import { useEffect } from 'react';

/**
 * Client-side Sentry initialization. Mounted once in the root layout.
 * No-op when NEXT_PUBLIC_SENTRY_DSN is unset, so dev builds incur no cost.
 */
export function SentryInit(): null {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    void import('@sentry/nextjs').then((Sentry) => {
      Sentry.init({
        dsn,
        environment:
          process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
          process.env.NODE_ENV ||
          'development',
        tracesSampleRate: parseFloat(
          process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0',
        ),
      });
    });
  }, []);

  return null;
}
