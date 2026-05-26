/**
 * Next.js instrumentation hook (App Router).
 *
 * Initializes Sentry for the Node.js and Edge runtimes. The browser runtime
 * is initialized separately by `components/sentry-init.tsx` mounted in the
 * root layout.
 *
 * All branches are no-ops when SENTRY_DSN is unset, so this incurs no
 * runtime cost or network call in local development.
 */
export async function register(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const environment =
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    'development';
  const tracesSampleRate = parseFloat(
    process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0',
  );

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({ dsn, environment, tracesSampleRate });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({ dsn, environment, tracesSampleRate });
  }
}
