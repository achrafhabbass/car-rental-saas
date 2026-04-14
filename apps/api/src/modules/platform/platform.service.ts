import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, Tenant, TenantStatus } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ListTenantsDto } from './dto/list-tenants.dto';
import {
  ExtendTrialDto,
  SuspendTenantDto,
  UpdateTenantPlatformDto,
} from './dto/update-tenant.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PlatformMetrics {
  tenants: { total: number; active: number; trial: number; suspended: number; cancelled: number };
  users: { total: number };
  fleet: { total: number };
  contracts: { active: number };
  revenue: { mrrApprox: number };
  expiring: { days7: number; days30: number };
  byPlan: Record<string, number>;
}

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  billingEmail: string | null;
  subscriptionEnd: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  userCount: number;
  vehicleCount: number;
  activeContractCount: number;
  outstandingBalance: number;
}

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  // -------- Metrics --------

  async getMetrics(): Promise<PlatformMetrics> {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * DAY_MS);
    const in30 = new Date(now.getTime() + 30 * DAY_MS);

    const [
      total,
      active,
      trial,
      suspended,
      cancelled,
      users,
      fleet,
      contracts,
      grouped,
      expiring7,
      expiring30,
      planAgg,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: 'TRIAL', deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: 'CANCELLED', deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, tenantId: { not: null } } }),
      this.prisma.vehicle.count({ where: { deletedAt: null } }),
      this.prisma.rentalContract.count({ where: { status: 'ACTIVE' } }),
      this.prisma.tenant.groupBy({
        by: ['plan'],
        where: { deletedAt: null, status: { in: ['ACTIVE', 'TRIAL'] } },
        _count: { _all: true },
      }),
      this.prisma.tenant.count({
        where: {
          deletedAt: null,
          status: { in: ['ACTIVE', 'TRIAL'] },
          OR: [
            { trialEndsAt: { gte: now, lte: in7 } },
            { subscriptionEnd: { gte: now, lte: in7 } },
          ],
        },
      }),
      this.prisma.tenant.count({
        where: {
          deletedAt: null,
          status: { in: ['ACTIVE', 'TRIAL'] },
          OR: [
            { trialEndsAt: { gte: now, lte: in30 } },
            { subscriptionEnd: { gte: now, lte: in30 } },
          ],
        },
      }),
      this.prisma.tenant.groupBy({
        by: ['plan'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const byPlan: Record<string, number> = {};
    for (const g of planAgg) byPlan[g.plan] = g._count._all;

    // Approximate MRR: annual plan list prices / 12 × active+trial count per plan.
    // (Real billing would come from payment records; this is a proxy.)
    const PLAN_ANNUAL: Record<string, number> = {
      STARTER: 2400,
      BUSINESS: 3600,
      ENTERPRISE: 12000,
    };
    let mrrApprox = 0;
    for (const g of grouped) {
      mrrApprox += ((PLAN_ANNUAL[g.plan] ?? 0) / 12) * g._count._all;
    }

    return {
      tenants: { total, active, trial, suspended, cancelled },
      users: { total: users },
      fleet: { total: fleet },
      contracts: { active: contracts },
      revenue: { mrrApprox: Math.round(mrrApprox) },
      expiring: { days7: expiring7, days30: expiring30 },
      byPlan,
    };
  }

  // -------- Listing / detail --------

  async list(dto: ListTenantsDto): Promise<PaginatedResult<Tenant>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.TenantWhereInput = { deletedAt: null };
    if (dto.status) where.status = dto.status;
    if (dto.plan) where.plan = dto.plan;
    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { slug: { contains: dto.q, mode: 'insensitive' } },
        { billingEmail: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(items, total, dto);
  }

  async getSummary(id: string): Promise<TenantSummary> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    const [userCount, vehicleCount, activeContractCount, outstanding] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id, deletedAt: null } }),
      this.prisma.vehicle.count({ where: { tenantId: id, deletedAt: null } }),
      this.prisma.rentalContract.count({
        where: { tenantId: id, status: 'ACTIVE' },
      }),
      this.prisma.invoice.aggregate({
        where: {
          tenantId: id,
          status: { in: ['ISSUED', 'PARTIAL', 'OVERDUE'] },
        },
        _sum: { balance: true },
      }),
    ]);

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      plan: tenant.plan,
      billingEmail: tenant.billingEmail,
      subscriptionEnd: tenant.subscriptionEnd?.toISOString() ?? null,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      createdAt: tenant.createdAt.toISOString(),
      userCount,
      vehicleCount,
      activeContractCount,
      outstandingBalance: Number(outstanding._sum.balance ?? 0),
    };
  }

  // -------- Mutations --------

  async update(id: string, dto: UpdateTenantPlatformDto): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    const data: Prisma.TenantUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.plan !== undefined) data.plan = dto.plan;
    if (dto.billingEmail !== undefined) data.billingEmail = dto.billingEmail;
    if (dto.subscriptionEnd !== undefined)
      data.subscriptionEnd = new Date(dto.subscriptionEnd);

    return this.prisma.tenant.update({ where: { id }, data });
  }

  async transition(id: string, to: TenantStatus, reason?: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    const allowed: Record<TenantStatus, TenantStatus[]> = {
      TRIAL: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'],
      ACTIVE: ['SUSPENDED', 'CANCELLED', 'EXPIRED'],
      SUSPENDED: ['ACTIVE', 'CANCELLED'],
      EXPIRED: ['ACTIVE', 'CANCELLED'],
      CANCELLED: ['ACTIVE'],
    };
    if (!allowed[tenant.status].includes(to)) {
      throw new BadRequestException(
        `Transition ${tenant.status} → ${to} not allowed`,
      );
    }

    const patch: Prisma.TenantUpdateInput = { status: to };
    if (reason) {
      patch.metadata = {
        ...((tenant.metadata as Prisma.JsonObject | null) ?? {}),
        lastStatusReason: reason,
        lastStatusChangeAt: new Date().toISOString(),
      };
    }
    // Promoting from trial to active bumps the subscription year if none set.
    if (to === 'ACTIVE' && !tenant.subscriptionEnd) {
      const start = new Date();
      const end = new Date(start);
      end.setUTCFullYear(end.getUTCFullYear() + 1);
      patch.subscriptionStart = start;
      patch.subscriptionEnd = end;
    }

    return this.prisma.tenant.update({ where: { id }, data: patch });
  }

  suspend(id: string, dto: SuspendTenantDto): Promise<Tenant> {
    return this.transition(id, 'SUSPENDED', dto.reason);
  }

  activate(id: string): Promise<Tenant> {
    return this.transition(id, 'ACTIVE');
  }

  cancel(id: string, dto: SuspendTenantDto): Promise<Tenant> {
    return this.transition(id, 'CANCELLED', dto.reason);
  }

  async extendTrial(id: string, dto: ExtendTrialDto): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    if (tenant.status !== 'TRIAL') {
      throw new BadRequestException('Only TRIAL tenants can have their trial extended');
    }
    const base = tenant.trialEndsAt ?? new Date();
    const reference = base.getTime() > Date.now() ? base : new Date();
    const newEnd = new Date(reference.getTime() + dto.days * DAY_MS);
    return this.prisma.tenant.update({
      where: { id },
      data: { trialEndsAt: newEnd },
    });
  }

  /// Bulk sweep: mark tenants as EXPIRED if their trial/subscription ended.
  /// Safe to run repeatedly (idempotent).
  async sweepExpiries(): Promise<{ expired: number }> {
    const now = new Date();
    const result = await this.prisma.tenant.updateMany({
      where: {
        deletedAt: null,
        status: { in: ['TRIAL', 'ACTIVE'] },
        OR: [
          { status: 'TRIAL', trialEndsAt: { lt: now } },
          { status: 'ACTIVE', subscriptionEnd: { lt: now } },
        ],
      },
      data: { status: 'EXPIRED' },
    });
    return { expired: result.count };
  }
}
