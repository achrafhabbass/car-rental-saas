import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  API_PORT: Joi.number().default(4000),
  API_HOST: Joi.string().default('0.0.0.0'),
  API_PREFIX: Joi.string().default('api/v1'),
  API_CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  TENANT_HEADER: Joi.string().default('x-tenant-id'),
  TENANT_STRATEGY: Joi.string().valid('header', 'subdomain', 'jwt').default('jwt'),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),

  SENTRY_DSN: Joi.string().uri().allow('').default(''),
  SENTRY_ENVIRONMENT: Joi.string().default(''),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0),

  // Cloudinary — leave cloud name empty to disable uploads.
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').default(''),
  CLOUDINARY_API_KEY: Joi.string().allow('').default(''),
  CLOUDINARY_API_SECRET: Joi.string().allow('').default(''),
  CLOUDINARY_UPLOAD_FOLDER: Joi.string().default('autosphere'),
  UPLOAD_MAX_BYTES: Joi.number().default(10485760), // 10 MB

  // Stripe — leave STRIPE_SECRET_KEY empty to disable subscription billing
  // (existing manual payment flow still works).
  STRIPE_SECRET_KEY: Joi.string().allow('').default(''),
  STRIPE_PUBLISHABLE_KEY: Joi.string().allow('').default(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').default(''),
  STRIPE_PRICE_STARTER_MONTHLY: Joi.string().allow('').default(''),
  STRIPE_PRICE_STARTER_ANNUAL: Joi.string().allow('').default(''),
  STRIPE_PRICE_BUSINESS_MONTHLY: Joi.string().allow('').default(''),
  STRIPE_PRICE_BUSINESS_ANNUAL: Joi.string().allow('').default(''),
  STRIPE_SUCCESS_URL: Joi.string().uri().allow('').default(''),
  STRIPE_CANCEL_URL: Joi.string().uri().allow('').default(''),
});
