export interface AppConfig {
  node: {
    env: 'development' | 'production' | 'test';
  };
  api: {
    port: number;
    host: string;
    prefix: string;
    corsOrigin: string;
  };
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    accessExpiration: string;
    refreshSecret: string;
    refreshExpiration: string;
  };
  tenant: {
    header: string;
    strategy: 'header' | 'subdomain' | 'jwt';
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  log: {
    level: string;
  };
  mail: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    enabled: boolean;
  };
  backup: {
    dir: string;
    cron: string;
    retentionDays: number;
  };
  sentry: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
  uploads: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
    maxBytes: number;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    successUrl: string;
    cancelUrl: string;
    priceIds: {
      STARTER: { monthly: string; annual: string };
      BUSINESS: { monthly: string; annual: string };
    };
  };
}

export default (): AppConfig => ({
  node: {
    env: (process.env.NODE_ENV as AppConfig['node']['env']) ?? 'development',
  },
  api: {
    port: parseInt(process.env.API_PORT ?? '4000', 10),
    host: process.env.API_HOST ?? '0.0.0.0',
    prefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigin: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
  },
  tenant: {
    header: process.env.TENANT_HEADER ?? 'x-tenant-id',
    strategy: (process.env.TENANT_STRATEGY as AppConfig['tenant']['strategy']) ?? 'jwt',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  log: {
    level: process.env.LOG_LEVEL ?? 'info',
  },
  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'noreply@autosphere.ma',
    enabled: process.env.MAIL_ENABLED === 'true',
  },
  backup: {
    dir: process.env.BACKUP_DIR ?? './backups',
    cron: process.env.BACKUP_CRON ?? '0 2 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS ?? '30', 10),
  },
  sentry: {
    dsn: process.env.SENTRY_DSN ?? '',
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
  },
  uploads: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'autosphere',
    maxBytes: parseInt(process.env.UPLOAD_MAX_BYTES ?? '10485760', 10),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    successUrl: process.env.STRIPE_SUCCESS_URL ?? '',
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? '',
    priceIds: {
      STARTER: {
        monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
        annual: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? '',
      },
      BUSINESS: {
        monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? '',
        annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? '',
      },
    },
  },
});
