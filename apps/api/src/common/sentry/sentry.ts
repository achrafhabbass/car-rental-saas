import * as Sentry from '@sentry/node';
import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

/**
 * Initialize Sentry from process.env. Must run BEFORE NestFactory.create()
 * so the SDK can instrument http/express handlers automatically.
 *
 * Returns true if Sentry was initialized, false if SENTRY_DSN is empty
 * (in which case all Sentry.* calls become no-ops and we never leave a
 * trace in the user's project).
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  });

  logger.log(
    `Sentry initialized (env=${process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV})`,
  );
  return true;
}

export { Sentry };
