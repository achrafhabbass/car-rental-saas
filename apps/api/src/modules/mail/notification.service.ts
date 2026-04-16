import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import * as tpl from './mail-templates';
import { MailService } from './mail.service';

/**
 * High-level notification service that resolves business entities
 * to email payloads and dispatches them via MailService.
 *
 * Every method is fire-and-forget (never throws).
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  async onReservationCreated(reservationId: string): Promise<void> {
    try {
      const r = await this.prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { client: true, vehicle: true, tenant: true },
      });
      if (!r || !r.tenant.billingEmail) return;

      const data = tpl.reservationCreated({
        code: r.reservationCode,
        clientName: r.client.fullName,
        vehicle: `${r.vehicle.brand} ${r.vehicle.model} · ${r.vehicle.registration}`,
        startDate: r.startDate.toLocaleDateString('fr-FR'),
        endDate: r.endDate.toLocaleDateString('fr-FR'),
        total: `${Number(r.totalAmount).toFixed(2)} MAD`,
      });
      await this.mail.send({ to: r.tenant.billingEmail, ...data });
    } catch (err) {
      this.logger.error(`onReservationCreated failed: ${(err as Error).message}`);
    }
  }

  async onContractCreated(contractId: string): Promise<void> {
    try {
      const c = await this.prisma.rentalContract.findUnique({
        where: { id: contractId },
        include: { client: true, vehicle: true, tenant: true },
      });
      if (!c || !c.tenant.billingEmail) return;

      const data = tpl.contractCreated({
        number: c.contractNumber,
        clientName: c.client.fullName,
        vehicle: `${c.vehicle.brand} ${c.vehicle.model} · ${c.vehicle.registration}`,
        startDate: c.startDate.toLocaleDateString('fr-FR'),
        endDate: c.endDate.toLocaleDateString('fr-FR'),
        total: `${Number(c.totalAmount).toFixed(2)} MAD`,
      });
      await this.mail.send({ to: c.tenant.billingEmail, ...data });
    } catch (err) {
      this.logger.error(`onContractCreated failed: ${(err as Error).message}`);
    }
  }

  async onPaymentReceived(paymentId: string): Promise<void> {
    try {
      const p = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { invoice: { include: { client: true, tenant: true } } },
      });
      if (!p?.invoice?.tenant?.billingEmail) return;

      const data = tpl.paymentReceived({
        invoiceNumber: p.invoice.invoiceNumber,
        clientName: p.invoice.client.fullName,
        amount: `${Number(p.amount).toFixed(2)} MAD`,
        method: p.method,
        date: p.paidAt.toLocaleDateString('fr-FR'),
      });
      await this.mail.send({ to: p.invoice.tenant.billingEmail, ...data });
    } catch (err) {
      this.logger.error(`onPaymentReceived failed: ${(err as Error).message}`);
    }
  }

  async onMaintenanceAlert(scheduleId: string): Promise<void> {
    try {
      const s = await this.prisma.maintenanceSchedule.findUnique({
        where: { id: scheduleId },
        include: { vehicle: { include: { tenant: true } } },
      });
      if (!s?.vehicle?.tenant?.billingEmail) return;

      const data = tpl.maintenanceAlert({
        vehicle: `${s.vehicle.brand} ${s.vehicle.model} · ${s.vehicle.registration}`,
        type: s.type,
        description: s.description ?? '—',
        dueDate: s.dueDate?.toLocaleDateString('fr-FR') ?? '—',
      });
      await this.mail.send({ to: s.vehicle.tenant.billingEmail, ...data });
    } catch (err) {
      this.logger.error(`onMaintenanceAlert failed: ${(err as Error).message}`);
    }
  }

  async onSubscriptionExpiring(
    tenantId: string,
    daysLeft: number,
  ): Promise<void> {
    try {
      const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!t?.billingEmail) return;

      const data = tpl.subscriptionExpiring({
        tenantName: t.name,
        plan: t.plan,
        expiresAt: t.subscriptionEnd?.toLocaleDateString('fr-FR') ?? '—',
        daysLeft,
      });
      await this.mail.send({ to: t.billingEmail, ...data });
    } catch (err) {
      this.logger.error(`onSubscriptionExpiring failed: ${(err as Error).message}`);
    }
  }
}
