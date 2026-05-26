import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Tenant, TenantPlan } from '@prisma/client';
import Stripe from 'stripe';

import type { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';

export type BillingPeriod = 'monthly' | 'annual';

// Stripe v22's CJS d.ts doesn't surface the full namespace through the
// default import, and webhook event payloads are inherently dynamic.
// We treat raw event/object shapes as `unknown` and narrow on the way in.
type StripeClient = InstanceType<typeof Stripe>;
export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: { object: unknown };
};

/**
 * Thin wrapper around the Stripe Node SDK.
 *
 * Disabled when STRIPE_SECRET_KEY is empty: any method that hits Stripe
 * throws 503, but the rest of the app keeps working (manual subscription
 * recording via /billing/payments stays available).
 */
@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe: StripeClient | null = null;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const { secretKey } = this.config.get('stripe', { infer: true });
    if (!secretKey) {
      this.logger.warn(
        'Stripe not configured — billing self-serve disabled. Set STRIPE_SECRET_KEY to enable.',
      );
      return;
    }
    // Use the SDK's default API version — keeps types in sync with the
    // installed stripe package without hard-coding a version string.
    this.stripe = new Stripe(secretKey);
    this.logger.log('Stripe configured');
  }

  isEnabled(): boolean {
    return this.stripe !== null;
  }

  private require(): StripeClient {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Stripe billing is not configured on this server.',
      );
    }
    return this.stripe;
  }

  private priceIdFor(plan: TenantPlan, period: BillingPeriod): string {
    const cfg = this.config.get('stripe', { infer: true });
    if (plan !== 'STARTER' && plan !== 'BUSINESS') {
      throw new BadRequestException(
        `Plan ${plan} is not available via self-serve checkout`,
      );
    }
    const priceId = cfg.priceIds[plan][period];
    if (!priceId) {
      throw new BadRequestException(
        `STRIPE_PRICE_${plan}_${period.toUpperCase()} is not configured`,
      );
    }
    return priceId;
  }

  /**
   * Get (or create) a Stripe Customer for this tenant. Idempotent on
   * tenant.stripeCustomerId — once set, we never make a new customer.
   */
  async ensureCustomer(tenant: Tenant): Promise<string> {
    const stripe = this.require();
    if (tenant.stripeCustomerId) return tenant.stripeCustomerId;

    const customer = await stripe.customers.create({
      email: tenant.billingEmail ?? undefined,
      name: tenant.name,
      metadata: { tenantId: tenant.id },
    });

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  async createCheckoutSession(
    tenantId: string,
    plan: TenantPlan,
    period: BillingPeriod,
  ): Promise<{ url: string; sessionId: string }> {
    const stripe = this.require();
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);

    const customerId = await this.ensureCustomer(tenant);
    const priceId = this.priceIdFor(plan, period);
    const { successUrl, cancelUrl } = this.config.get('stripe', { infer: true });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'http://localhost:3000/settings?checkout=success',
      cancel_url: cancelUrl || 'http://localhost:3000/settings?checkout=cancelled',
      // Stash plan/period in metadata so the webhook can apply them
      // even if Stripe doesn't surface the price id directly.
      metadata: { tenantId: tenant.id, plan, period },
      subscription_data: {
        metadata: { tenantId: tenant.id, plan, period },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new ServiceUnavailableException('Stripe did not return a checkout URL');
    }
    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(tenantId: string): Promise<{ url: string }> {
    const stripe = this.require();
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);
    if (!tenant.stripeCustomerId) {
      throw new BadRequestException(
        'No Stripe customer for this tenant. Start a checkout first.',
      );
    }
    const { successUrl } = this.config.get('stripe', { infer: true });
    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: successUrl || 'http://localhost:3000/settings',
    });
    return { url: session.url };
  }

  /**
   * Verify the Stripe-Signature header against the raw request body.
   * Returns the parsed event (typed loosely; downstream handlers narrow
   * on `event.type`). Throws 400 on any verification failure.
   */
  verifyWebhook(rawBody: Buffer, signature: string | undefined): StripeWebhookEvent {
    const stripe = this.require();
    const { webhookSecret } = this.config.get('stripe', { infer: true });
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }
    if (!signature) {
      throw new BadRequestException('Missing Stripe-Signature header');
    }
    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      return event as unknown as StripeWebhookEvent;
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Idempotency check + record. Returns `true` if this is the first time
   * we see this event id (caller should process it); `false` if it's a
   * Stripe retry of an already-processed event.
   */
  async markEventProcessed(eventId: string, type: string): Promise<boolean> {
    try {
      await this.prisma.stripeEvent.create({
        data: { id: eventId, type },
      });
      return true;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2002') return false;
      throw err;
    }
  }

  /**
   * Apply a paid invoice to the tenant: extend subscriptionEnd by the
   * billing period, set status=ACTIVE, persist subscription id.
   */
  async applyInvoicePaid(invoice: unknown): Promise<void> {
    const inv = invoice as {
      customer: string | { id: string } | null;
      subscription?: string | { id: string } | null;
      // Stripe v23+ migrated to invoice.parent.subscription_details.subscription
      parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
    };
    const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
    if (!customerId) return;

    const tenant = await this.prisma.tenant.findUnique({
      where: { stripeCustomerId: customerId },
    });
    if (!tenant) {
      this.logger.warn(`invoice.paid for unknown stripeCustomerId=${customerId}`);
      return;
    }

    // Resolve the subscription id from either the legacy top-level field
    // or the v23+ parent.subscription_details path.
    const subRef = inv.subscription ?? inv.parent?.subscription_details?.subscription;
    const subId = typeof subRef === 'string' ? subRef : subRef?.id ?? null;

    let plan: TenantPlan = tenant.plan;
    let period: BillingPeriod = 'annual';
    if (subId) {
      const sub = await this.require().subscriptions.retrieve(subId);
      const meta = sub.metadata ?? {};
      if (meta.plan === 'STARTER' || meta.plan === 'BUSINESS') plan = meta.plan;
      if (meta.period === 'monthly' || meta.period === 'annual') period = meta.period;
    }

    const periodDays = period === 'annual' ? 365 : 30;
    const now = new Date();
    const currentEnd = tenant.subscriptionEnd && tenant.subscriptionEnd > now
      ? tenant.subscriptionEnd
      : now;
    const newEnd = new Date(currentEnd.getTime() + periodDays * 24 * 60 * 60 * 1000);

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        plan,
        status: 'ACTIVE',
        subscriptionStart: tenant.subscriptionStart ?? now,
        subscriptionEnd: newEnd,
        ...(subId && !tenant.stripeSubscriptionId
          ? { stripeSubscriptionId: subId }
          : {}),
      },
    });
    this.logger.log(
      `Tenant ${tenant.id} extended to ${newEnd.toISOString()} (plan=${plan}, period=${period})`,
    );
  }

  async applySubscriptionDeleted(sub: unknown): Promise<void> {
    const s = sub as { customer: string | { id: string } };
    const customerId = typeof s.customer === 'string' ? s.customer : s.customer.id;
    const tenant = await this.prisma.tenant.findUnique({
      where: { stripeCustomerId: customerId },
    });
    if (!tenant) return;
    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'SUSPENDED', stripeSubscriptionId: null },
    });
    this.logger.log(`Tenant ${tenant.id} suspended (Stripe sub deleted)`);
  }
}
