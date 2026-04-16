import { Injectable, Logger } from '@nestjs/common';
import type { TenantPlan } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { getPlan } from './plan-definitions';
import { PlanLimitExceededException } from './plan-limit.exception';

export type LimitableResource = 'vehicles' | 'users' | 'reservations' | 'contracts';

/**
 * Centralized plan enforcement service.
 *
 * Call `enforce(tenantId, resource)` before any creation.
 * Throws `PlanLimitExceededException` if the quota is reached.
 * Returns silently if OK or if the plan has no limit for that resource.
 */
@Injectable()
export class PlanLimitService {
  private readonly logger = new Logger(PlanLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check and enforce plan limits. Throws if limit exceeded.
   */
  async enforce(tenantId: string, resource: LimitableResource): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, name: true },
    });
    if (!tenant) return; // Tenant not found — let other guards handle this

    const plan = getPlan(tenant.plan);
    const limit = this.getLimit(plan.key, resource);
    if (limit === null) return; // Unlimited

    const current = await this.countResource(tenantId, resource);

    if (current >= limit) {
      this.logger.warn(
        `Plan limit hit: tenant=${tenant.name} resource=${resource} current=${current} limit=${limit} plan=${plan.name}`,
      );
      throw new PlanLimitExceededException(resource, current, limit, plan.name);
    }
  }

  /**
   * Check limits without throwing. Returns usage info.
   */
  async getUsage(
    tenantId: string,
    resource: LimitableResource,
  ): Promise<{ current: number; limit: number | null; exceeded: boolean }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    if (!tenant) return { current: 0, limit: null, exceeded: false };

    const limit = this.getLimit(tenant.plan, resource);
    const current = await this.countResource(tenantId, resource);

    return {
      current,
      limit,
      exceeded: limit !== null && current >= limit,
    };
  }

  /**
   * Get all resource usages for a tenant at once (dashboard).
   */
  async getAllUsages(tenantId: string): Promise<
    Record<LimitableResource, { current: number; limit: number | null; exceeded: boolean }>
  > {
    const resources: LimitableResource[] = ['vehicles', 'users', 'reservations', 'contracts'];
    const results = {} as Record<LimitableResource, { current: number; limit: number | null; exceeded: boolean }>;
    for (const r of resources) {
      results[r] = await this.getUsage(tenantId, r);
    }
    return results;
  }

  private getLimit(plan: TenantPlan, resource: LimitableResource): number | null {
    const def = getPlan(plan);
    switch (resource) {
      case 'vehicles':
        return def.maxVehicles;
      case 'users':
        return def.maxUsers;
      case 'reservations':
        return null; // No reservation limit for now
      case 'contracts':
        return null; // No contract limit for now
      default:
        return null;
    }
  }

  private async countResource(
    tenantId: string,
    resource: LimitableResource,
  ): Promise<number> {
    switch (resource) {
      case 'vehicles':
        return this.prisma.vehicle.count({
          where: { tenantId, deletedAt: null },
        });
      case 'users':
        return this.prisma.user.count({
          where: { tenantId, deletedAt: null },
        });
      case 'reservations':
        return this.prisma.reservation.count({
          where: {
            tenantId,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
        });
      case 'contracts':
        return this.prisma.rentalContract.count({
          where: {
            tenantId,
            status: { in: ['DRAFT', 'ACTIVE'] },
            deletedAt: null,
          },
        });
    }
  }
}
