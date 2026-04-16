import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import * as tpl from './mail-templates';
import { MailService } from './mail.service';

/**
 * High-level notification service. Resolves business entities to email
 * payloads and dispatches via MailService. Every method is fire-and-forget.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mail: MailService,
    private readonly prisma: PrismaService,
  ) {}

  // ────────── Business events ──────────

  async onReservationCreated(reservationId: string): Promise<void> {
    try {
      const r = await this.prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { client: true, vehicle: true, tenant: true },
      });
      if (!r?.tenant.billingEmail) return;
      const data = tpl.reservationCreated({
        code: r.reservationCode,
        clientName: r.client.fullName,
        vehicle: `${r.vehicle.brand} ${r.vehicle.model} · ${r.vehicle.registration}`,
        startDate: r.startDate.toLocaleDateString('fr-FR'),
        endDate: r.endDate.toLocaleDateString('fr-FR'),
        total: `${Number(r.totalAmount).toFixed(2)} MAD`,
      });
      await this.mail.send({
        to: r.tenant.billingEmail,
        ...data,
        tenantId: r.tenantId,
      });
    } catch (err) {
      this.logger.error(`onReservationCreated: ${(err as Error).message}`);
    }
  }

  async onContractCreated(contractId: string): Promise<void> {
    try {
      const c = await this.prisma.rentalContract.findUnique({
        where: { id: contractId },
        include: { client: true, vehicle: true, tenant: true },
      });
      if (!c?.tenant.billingEmail) return;
      const data = tpl.contractCreated({
        number: c.contractNumber,
        clientName: c.client.fullName,
        vehicle: `${c.vehicle.brand} ${c.vehicle.model} · ${c.vehicle.registration}`,
        startDate: c.startDate.toLocaleDateString('fr-FR'),
        endDate: c.endDate.toLocaleDateString('fr-FR'),
        total: `${Number(c.totalAmount).toFixed(2)} MAD`,
      });
      await this.mail.send({
        to: c.tenant.billingEmail,
        ...data,
        tenantId: c.tenantId,
      });
    } catch (err) {
      this.logger.error(`onContractCreated: ${(err as Error).message}`);
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
      await this.mail.send({
        to: p.invoice.tenant.billingEmail,
        ...data,
        tenantId: p.invoice.tenantId,
      });
    } catch (err) {
      this.logger.error(`onPaymentReceived: ${(err as Error).message}`);
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
      await this.mail.send({
        to: s.vehicle.tenant.billingEmail,
        ...data,
        tenantId: s.vehicle.tenantId,
      });
    } catch (err) {
      this.logger.error(`onMaintenanceAlert: ${(err as Error).message}`);
    }
  }

  // ────────── Subscription events ──────────

  async onSubscriptionExpiring(tenantId: string, daysLeft: number): Promise<void> {
    try {
      const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!t?.billingEmail) return;
      const data = tpl.subscriptionExpiring({
        tenantName: t.name,
        plan: t.plan,
        expiresAt: t.subscriptionEnd?.toLocaleDateString('fr-FR') ?? '—',
        daysLeft,
      });
      await this.mail.send({ to: t.billingEmail, ...data, tenantId });
    } catch (err) {
      this.logger.error(`onSubscriptionExpiring: ${(err as Error).message}`);
    }
  }

  async onSubscriptionExpired(tenantId: string): Promise<void> {
    try {
      const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!t?.billingEmail) return;
      const data = tpl.subscriptionExpired({
        tenantName: t.name,
        plan: t.plan,
        expiredAt: t.subscriptionEnd?.toLocaleDateString('fr-FR') ?? '—',
      });
      await this.mail.send({ to: t.billingEmail, ...data, tenantId });
    } catch (err) {
      this.logger.error(`onSubscriptionExpired: ${(err as Error).message}`);
    }
  }

  async onAccountSuspended(tenantId: string, reason?: string): Promise<void> {
    try {
      const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!t?.billingEmail) return;
      const data = tpl.accountSuspended({ tenantName: t.name, reason });
      await this.mail.send({ to: t.billingEmail, ...data, tenantId });
    } catch (err) {
      this.logger.error(`onAccountSuspended: ${(err as Error).message}`);
    }
  }

  async onAccountReactivated(
    tenantId: string,
    plan: string,
    newEndDate: string,
  ): Promise<void> {
    try {
      const t = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!t?.billingEmail) return;
      const data = tpl.accountReactivated({
        tenantName: t.name,
        plan,
        newEndDate,
      });
      await this.mail.send({ to: t.billingEmail, ...data, tenantId });
    } catch (err) {
      this.logger.error(`onAccountReactivated: ${(err as Error).message}`);
    }
  }

  // ────────── Billing events ──────────

  async onInvoiceGenerated(data: {
    invoiceNumber: string;
    tenantName: string;
    email: string;
    plan: string;
    amountHt: string;
    totalTtc: string;
    period: string;
    tenantId: string;
  }): Promise<void> {
    try {
      const tplData = tpl.invoiceGenerated({
        invoiceNumber: data.invoiceNumber,
        tenantName: data.tenantName,
        plan: data.plan,
        amountHt: data.amountHt,
        totalTtc: data.totalTtc,
        period: data.period,
      });
      await this.mail.send({
        to: data.email,
        ...tplData,
        tenantId: data.tenantId,
      });
    } catch (err) {
      this.logger.error(`onInvoiceGenerated: ${(err as Error).message}`);
    }
  }

  async onReceiptGenerated(data: {
    receiptNumber: string;
    tenantName: string;
    email: string;
    amount: string;
    method: string;
    tenantId: string;
  }): Promise<void> {
    try {
      const tplData = tpl.receiptGenerated({
        receiptNumber: data.receiptNumber,
        tenantName: data.tenantName,
        amount: data.amount,
        method: data.method,
      });
      await this.mail.send({
        to: data.email,
        ...tplData,
        tenantId: data.tenantId,
      });
    } catch (err) {
      this.logger.error(`onReceiptGenerated: ${(err as Error).message}`);
    }
  }

  // ────────── System events ──────────

  async onBackupFailed(category: string, filename: string, error: string): Promise<void> {
    const adminEmail = await this.getSuperAdminEmail();
    if (!adminEmail) return;
    try {
      const data = tpl.backupFailed({
        category,
        filename,
        error,
        date: new Date().toLocaleString('fr-FR'),
      });
      await this.mail.send({ to: adminEmail, ...data });
    } catch (err) {
      this.logger.error(`onBackupFailed: ${(err as Error).message}`);
    }
  }

  async onRestoreCompleted(category: string, filename: string): Promise<void> {
    const adminEmail = await this.getSuperAdminEmail();
    if (!adminEmail) return;
    try {
      const data = tpl.restoreCompleted({
        category,
        filename,
        date: new Date().toLocaleString('fr-FR'),
      });
      await this.mail.send({ to: adminEmail, ...data });
    } catch (err) {
      this.logger.error(`onRestoreCompleted: ${(err as Error).message}`);
    }
  }

  async onCriticalError(service: string, error: string): Promise<void> {
    const adminEmail = await this.getSuperAdminEmail();
    if (!adminEmail) return;
    try {
      const data = tpl.criticalError({
        service,
        error,
        date: new Date().toLocaleString('fr-FR'),
      });
      await this.mail.send({ to: adminEmail, ...data });
    } catch (err) {
      this.logger.error(`onCriticalError: ${(err as Error).message}`);
    }
  }

  // ────────── Helpers ──────────

  private async getSuperAdminEmail(): Promise<string | null> {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null },
      select: { email: true },
    });
    return admin?.email ?? null;
  }
}
