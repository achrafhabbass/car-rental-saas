import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { RolesGuard } from './common/guards/roles.guard';
import { TenantGuard } from './common/guards/tenant.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { HealthModule } from './modules/health/health.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { VehicleCreditsModule } from './modules/vehicle-credits/vehicle-credits.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * Global guard chain (executed in declaration order):
 *   1. ThrottlerGuard — rate limiting
 *   2. JwtAuthGuard   — authentication (declared inside AuthModule)
 *   3. TenantGuard    — multi-tenant isolation
 *   4. RolesGuard     — authorization (RBAC)
 *
 * Opt-outs: @Public() (skips auth + tenant), @AllowNoTenant() (skips tenant),
 * and absence of @Roles() (no role check).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      cache: true,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: Number(process.env.THROTTLE_TTL ?? 60) * 1000,
          limit: Number(process.env.THROTTLE_LIMIT ?? 100),
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    NotificationsModule,
    AlertsModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    VehiclesModule,
    ClientsModule,
    ReservationsModule,
    ContractsModule,
    PaymentsModule,
    InvoicesModule,
    VehicleCreditsModule,
    MaintenanceModule,
    AnalyticsModule,
  ],
  providers: [
    TenantMiddleware,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
