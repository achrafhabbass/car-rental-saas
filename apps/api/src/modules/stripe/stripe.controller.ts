import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@Controller('billing/stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(private readonly stripe: StripeService) {}

  /**
   * Start a Stripe Checkout session for the current tenant.
   * Client receives a hosted Stripe URL and redirects to it.
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a Stripe Checkout session (subscription)' })
  @Roles('ADMIN')
  @Post('checkout')
  async checkout(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.stripe.createCheckoutSession(tenantId, dto.plan, dto.period);
  }

  /**
   * Start a Stripe Customer Portal session — lets the tenant manage
   * their card, plan, invoices and cancel directly with Stripe.
   */
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a Stripe Customer Portal session' })
  @Roles('ADMIN')
  @Post('portal')
  async portal(@CurrentTenant() tenantId: string) {
    return this.stripe.createPortalSession(tenantId);
  }

  /**
   * Stripe webhook receiver. Verifies the signature against the raw
   * request body and dispatches three event types:
   *  - checkout.session.completed → activate tenant (subscription_id stored
   *                                 via invoice.paid that follows it)
   *  - invoice.paid               → extend tenant subscriptionEnd
   *  - customer.subscription.deleted → suspend tenant
   *
   * All other events return 200 OK without action (Stripe expects 2xx
   * to stop retrying). Idempotent: same event id is processed at most once.
   */
  @Public()
  @AllowNoTenant()
  @ApiOperation({ summary: 'Stripe webhook receiver (no auth, signature verified)' })
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Req() req: RawBodyRequest<Request>): Promise<{ received: true }> {
    const signature = req.headers['stripe-signature'];
    const sig = Array.isArray(signature) ? signature[0] : signature;
    if (!req.rawBody) {
      this.logger.error('Webhook called without rawBody — main.ts is misconfigured');
      throw new Error('rawBody not enabled on NestFactory');
    }

    const event = this.stripe.verifyWebhook(req.rawBody, sig);
    const first = await this.stripe.markEventProcessed(event.id, event.type);
    if (!first) {
      this.logger.log(`Stripe event ${event.id} already processed, skipping`);
      return { received: true };
    }

    try {
      switch (event.type) {
        case 'invoice.paid':
          await this.stripe.applyInvoicePaid(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.stripe.applySubscriptionDeleted(event.data.object);
          break;
        case 'checkout.session.completed': {
          // Activation is handled by the invoice.paid that always follows.
          // No-op here keeps the handler simple and avoids double-extension.
          const session = event.data.object as { id: string };
          this.logger.log(
            `checkout.session.completed received (session=${session.id})`,
          );
          break;
        }
        default:
          this.logger.debug(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (err) {
      this.logger.error(
        `Failed to process ${event.type} ${event.id}: ${(err as Error).message}`,
      );
      throw err;
    }

    return { received: true };
  }
}
