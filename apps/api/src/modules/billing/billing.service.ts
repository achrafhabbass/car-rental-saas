import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { SubscriptionInvoice, SubscriptionPayment, TenantPlan } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../mail/notification.service';
import { getPlan, PLANS, type PlanDefinition } from './plan-definitions';
import { buildSubscriptionInvoicePdf } from './subscription-invoice-pdf';
import type { RecordSubscriptionPaymentDto } from './dto/record-payment.dto';

const TAX_RATE = 0.20;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  /** Return all plan definitions. */
  getPlans(): PlanDefinition[] {
    return Object.values(PLANS);
  }

  /** Payment history for a specific tenant. */
  async getPayments(tenantId: string): Promise<SubscriptionPayment[]> {
    return this.prisma.subscriptionPayment.findMany({
      where: { tenantId },
      orderBy: { paidAt: 'desc' },
    });
  }

  /** All payments across all tenants (super-admin). */
  async getAllPayments(limit = 50): Promise<SubscriptionPayment[]> {
    return this.prisma.subscriptionPayment.findMany({
      orderBy: { paidAt: 'desc' },
      take: limit,
      include: { tenant: { select: { name: true, slug: true } } },
    });
  }

  /**
   * Record a subscription payment and activate/extend the tenant.
   *
   * Business rules:
   *   - Calculates endDate from startDate + period (30d or 365d)
   *   - Updates tenant: plan, status→ACTIVE, subscriptionStart/End
   *   - If tenant was EXPIRED/SUSPENDED → reactivated automatically
   *   - Sends confirmation email
   */
  async recordPayment(
    tenantId: string,
    dto: RecordSubscriptionPaymentDto,
  ): Promise<SubscriptionPayment> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    const plan = getPlan(dto.plan);
    const periodDays = dto.period === 'ANNUAL' ? 365 : 30;

    // Start date: provided, or current subscription end (if extending), or now
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : tenant.subscriptionEnd && tenant.subscriptionEnd > new Date()
        ? tenant.subscriptionEnd
        : new Date();

    const endDate = new Date(startDate.getTime() + periodDays * 24 * 60 * 60 * 1000);

    // Validate amount against expected price
    const expectedPrice = dto.period === 'ANNUAL' ? plan.priceAnnual : plan.priceMonthly;
    if (dto.amount < expectedPrice * 0.5) {
      throw new BadRequestException(
        `Le montant (${dto.amount}) semble trop bas pour le plan ${plan.name} ${dto.period === 'ANNUAL' ? 'annuel' : 'mensuel'} (prix: ${expectedPrice} MAD)`,
      );
    }

    // Create payment record
    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        tenantId,
        plan: dto.plan,
        period: dto.period,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        startDate,
        endDate,
        notes: dto.notes,
      },
    });

    // Activate/extend tenant
    const wasExpiredOrSuspended =
      tenant.status === 'EXPIRED' || tenant.status === 'SUSPENDED';
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: dto.plan,
        status: 'ACTIVE',
        subscriptionStart: startDate,
        subscriptionEnd: endDate,
      },
    });

    this.logger.log(
      `Payment recorded for ${tenant.name}: ${plan.name} ${dto.period} — ${dto.amount} MAD → active until ${endDate.toISOString().slice(0, 10)}`,
    );

    if (wasExpiredOrSuspended) {
      this.logger.log(`Tenant ${tenant.name} reactivated from ${tenant.status}`);
    }

    // Auto-generate invoice
    void this.createInvoice(payment.id, tenantId, Number(payment.amount));

    return payment;
  }

  /**
   * Auto-generate a subscription invoice linked to a payment.
   */
  async createInvoice(
    paymentId: string,
    tenantId: string,
    amountHt: number,
  ): Promise<SubscriptionInvoice> {
    const taxAmount = Math.round(amountHt * TAX_RATE * 100) / 100;
    const totalTtc = Math.round((amountHt + taxAmount) * 100) / 100;
    const invoiceNumber = await this.generateInvoiceNumber();

    return this.prisma.subscriptionInvoice.create({
      data: {
        invoiceNumber,
        paymentId,
        tenantId,
        amount: amountHt,
        taxRate: TAX_RATE,
        taxAmount,
        totalTtc,
      },
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const prefix = `SINV-${now.getFullYear()}-`;
    const last = await this.prisma.subscriptionInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    const seq = last
      ? parseInt(last.invoiceNumber.replace(prefix, ''), 10) + 1
      : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /** List invoices for super-admin. */
  async listInvoices(limit = 50): Promise<SubscriptionInvoice[]> {
    return this.prisma.subscriptionInvoice.findMany({
      orderBy: { issuedAt: 'desc' },
      take: limit,
      include: {
        tenant: { select: { name: true, slug: true } },
        payment: {
          select: { plan: true, period: true, method: true, reference: true, startDate: true, endDate: true },
        },
      },
    });
  }

  /** Generate a PDF stream for a subscription invoice. */
  async generateInvoicePdf(invoiceId: string): Promise<NodeJS.ReadableStream> {
    const inv = await this.prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        payment: true,
      },
    });
    if (!inv) throw new NotFoundException(`Invoice ${invoiceId} not found`);

    const plan = getPlan(inv.payment.plan);
    const periodLabel = inv.payment.period === 'ANNUAL' ? 'Annuel' : 'Mensuel';

    return buildSubscriptionInvoicePdf({
      invoiceNumber: inv.invoiceNumber,
      issuedAt: inv.issuedAt,
      issuer: {
        name: 'AutoSphere SaaS',
        address: 'Plateforme de gestion de location de voitures',
        phone: null,
        email: 'billing@autosphere.ma',
      },
      client: {
        name: inv.tenant.name,
        address: inv.tenant.address,
        city: inv.tenant.city,
        ice: inv.tenant.ice,
        rc: inv.tenant.rc,
      },
      plan: plan.name,
      period: periodLabel,
      startDate: inv.payment.startDate.toLocaleDateString('fr-FR'),
      endDate: inv.payment.endDate.toLocaleDateString('fr-FR'),
      amountHt: Number(inv.amount),
      taxRate: Number(inv.taxRate),
      taxAmount: Number(inv.taxAmount),
      totalTtc: Number(inv.totalTtc),
      currency: inv.currency,
      method: inv.payment.method,
      reference: inv.payment.reference,
    });
  }

  /**
   * Check if a tenant has exceeded its plan limits.
   * Returns null if OK, or an error message if exceeded.
   */
  async checkLimits(
    tenantId: string,
    plan: TenantPlan,
    resource: 'vehicles' | 'users',
  ): Promise<string | null> {
    const def = getPlan(plan);
    const limit = resource === 'vehicles' ? def.maxVehicles : def.maxUsers;
    if (limit === null) return null; // unlimited

    const count =
      resource === 'vehicles'
        ? await this.prisma.vehicle.count({ where: { tenantId, deletedAt: null } })
        : await this.prisma.user.count({ where: { tenantId, deletedAt: null } });

    if (count >= limit) {
      return `Limite du plan ${def.name} atteinte : ${count}/${limit} ${resource === 'vehicles' ? 'véhicules' : 'utilisateurs'}. Passez à un plan supérieur.`;
    }
    return null;
  }

  /** Billing summary for the platform dashboard. */
  async getBillingSummary(): Promise<{
    totalRevenue: number;
    revenueThisMonth: number;
    paymentCount: number;
    avgPayment: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [total, thisMonth, count] = await Promise.all([
      this.prisma.subscriptionPayment.aggregate({ _sum: { amount: true } }),
      this.prisma.subscriptionPayment.aggregate({
        where: { paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.subscriptionPayment.count(),
    ]);

    const totalRevenue = Number(total._sum.amount ?? 0);
    return {
      totalRevenue,
      revenueThisMonth: Number(thisMonth._sum.amount ?? 0),
      paymentCount: count,
      avgPayment: count > 0 ? totalRevenue / count : 0,
    };
  }
}
