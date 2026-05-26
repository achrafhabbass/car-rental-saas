import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { initSentry } from './common/sentry/sentry';

// Sentry init must happen before the Nest app is created so the SDK can
// auto-instrument http/express. No-op when SENTRY_DSN is unset.
initSentry();

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    // Stripe webhook signature verification requires the raw request body.
    // Express's json parser destroys it; rawBody preserves a copy on req.rawBody.
    rawBody: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('api.port', 4000);
  const host = config.get<string>('api.host', '0.0.0.0');
  const prefix = config.get<string>('api.prefix', 'api/v1');
  const corsOrigin = config.get<string>('api.corsOrigin', 'http://localhost:3000');

  app.setGlobalPrefix(prefix);
  app.use(helmet());
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => {
      const trimmed = o.trim();
      if (trimmed.includes('*')) {
        // Convert wildcard pattern to RegExp (e.g. https://*.ngrok-free.app)
        const escaped = trimmed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
        return new RegExp(`^${escaped}$`);
      }
      return trimmed;
    }),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Explicit @Type / @ToBoolean / @Transform on every DTO field.
      // Implicit conversion uses Boolean() for bool fields, which silently
      // turns "false" into true — broke the client-list blacklisted filter.
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AutoSphere API')
    .setDescription(
      'API REST pour la plateforme SaaS multi-tenant de gestion de location de voitures.\n\n' +
      '**Authentification** : Bearer JWT (access token) + header `x-tenant-id`.\n\n' +
      '**Rôles** : SUPER_ADMIN, ADMIN, MANAGER, EMPLOYEE, ACCOUNTANT.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Auth', 'Authentification, inscription, profil')
    .addTag('Users', 'Gestion des membres de l\'équipe')
    .addTag('Vehicles', 'Parc de véhicules')
    .addTag('Clients', 'Gestion des clients')
    .addTag('Reservations', 'Réservations de véhicules')
    .addTag('Contracts', 'Contrats de location')
    .addTag('Invoices', 'Factures client')
    .addTag('Payments', 'Paiements')
    .addTag('Maintenance', 'Maintenance et planification')
    .addTag('Inspections', 'Inspections véhicules')
    .addTag('Deposits', 'Cautions')
    .addTag('Analytics', 'Tableau de bord et rapports')
    .addTag('Alerts', 'Système d\'alertes')
    .addTag('Platform', 'Administration plateforme (SUPER_ADMIN)')
    .addTag('Billing', 'Facturation abonnements')
    .addTag('Backup', 'Sauvegardes système')
    .addTag('Email', 'Monitoring email')
    .addTag('Uploads', 'Téléversement de fichiers (photos, signatures)')
    .addTag('Stripe', 'Checkout, Customer Portal et webhooks Stripe')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'AutoSphere API Documentation',
    customCss: '.swagger-ui .topbar { background-color: #1B3A6B; }',
  });

  app.enableShutdownHooks();

  await app.listen(port, host);
  logger.log(`API docs available at http://${host}:${port}/api/docs`);
  logger.log(`AutoSphere API running at http://${host}:${port}/${prefix}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap API', err);
  process.exit(1);
});
