import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/// How many days in advance we warn before a document expires / payment is due.
const WARNING_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

interface UpsertAlertInput {
  tenantId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  dueAt: Date | null;
  vehicleId?: string | null;
  contractId?: string | null;
  invoiceId?: string | null;
  creditId?: string | null;
  scheduleId?: string | null;
  link?: string;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------- Query -------------

  list(
    tenantId: string,
    filter: { status?: AlertStatus; severity?: AlertSeverity; vehicleId?: string } = {},
  ): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: {
        tenantId,
        status: filter.status,
        severity: filter.severity,
        vehicleId: filter.vehicleId,
      },
      orderBy: [{ severity: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async summary(tenantId: string): Promise<{
    total: number;
    open: number;
    critical: number;
    byType: Record<string, number>;
  }> {
    const [total, open, critical, grouped] = await Promise.all([
      this.prisma.alert.count({ where: { tenantId } }),
      this.prisma.alert.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.alert.count({
        where: { tenantId, status: 'OPEN', severity: 'CRITICAL' },
      }),
      this.prisma.alert.groupBy({
        by: ['type'],
        where: { tenantId, status: 'OPEN' },
        _count: { _all: true },
      }),
    ]);
    const byType: Record<string, number> = {};
    for (const g of grouped) byType[g.type] = g._count._all;
    return { total, open, critical, byType };
  }

  async acknowledge(tenantId: string, id: string): Promise<Alert> {
    const res = await this.prisma.alert.updateMany({
      where: { id, tenantId, status: 'OPEN' },
      data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date() },
    });
    if (res.count === 0) throw new NotFoundException(`Alert ${id} not found or not open`);
    return this.prisma.alert.findUniqueOrThrow({ where: { id } });
  }

  async resolve(tenantId: string, id: string): Promise<Alert> {
    const res = await this.prisma.alert.updateMany({
      where: { id, tenantId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
    if (res.count === 0) throw new NotFoundException(`Alert ${id} not found`);
    return this.prisma.alert.findUniqueOrThrow({ where: { id } });
  }

  // ------------- Sync helpers -------------

  /// Create-or-update the matching open alert for a given (tenant, type, target).
  /// Emits an in-app notification only when a new OPEN alert is created, so we
  /// don't spam users when the same condition recurs on every resync.
  private async upsertAlert(input: UpsertAlertInput): Promise<void> {
    const target: Prisma.AlertWhereInput = {
      tenantId: input.tenantId,
      type: input.type,
      status: { not: 'RESOLVED' },
      vehicleId: input.vehicleId ?? null,
      contractId: input.contractId ?? null,
      invoiceId: input.invoiceId ?? null,
      creditId: input.creditId ?? null,
      scheduleId: input.scheduleId ?? null,
    };

    const existing = await this.prisma.alert.findFirst({ where: target });
    if (existing) {
      await this.prisma.alert.update({
        where: { id: existing.id },
        data: {
          severity: input.severity,
          title: input.title,
          message: input.message,
          dueAt: input.dueAt,
        },
      });
      return;
    }

    const alert = await this.prisma.alert.create({
      data: {
        tenantId: input.tenantId,
        type: input.type,
        severity: input.severity,
        title: input.title,
        message: input.message,
        dueAt: input.dueAt,
        vehicleId: input.vehicleId ?? null,
        contractId: input.contractId ?? null,
        invoiceId: input.invoiceId ?? null,
        creditId: input.creditId ?? null,
        scheduleId: input.scheduleId ?? null,
      },
    });

    await this.notifications.broadcastToAdmins({
      tenantId: input.tenantId,
      title: input.title,
      body: input.message,
      link: input.link,
      alertId: alert.id,
    });
  }

  /// Close any currently-open alerts for a given target that no longer apply.
  private async resolveMatching(
    tenantId: string,
    type: AlertType,
    scope: Partial<Pick<Alert, 'vehicleId' | 'contractId' | 'invoiceId' | 'creditId' | 'scheduleId'>>,
  ): Promise<void> {
    await this.prisma.alert.updateMany({
      where: {
        tenantId,
        type,
        status: { not: 'RESOLVED' },
        vehicleId: scope.vehicleId ?? null,
        contractId: scope.contractId ?? null,
        invoiceId: scope.invoiceId ?? null,
        creditId: scope.creditId ?? null,
        scheduleId: scope.scheduleId ?? null,
      },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  // ------------- Target syncs -------------

  async syncVehicleAlerts(tenantId: string, vehicleId: string): Promise<void> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId, deletedAt: null },
    });
    if (!vehicle) return;

    const now = Date.now();
    const windowMs = WARNING_WINDOW_DAYS * DAY_MS;

    // Insurance
    if (vehicle.insuranceExpiry) {
      const diff = vehicle.insuranceExpiry.getTime() - now;
      if (diff <= 0) {
        await this.upsertAlert({
          tenantId,
          type: 'INSURANCE_EXPIRY',
          severity: 'CRITICAL',
          title: `Assurance expirée · ${vehicle.registration}`,
          message: `L'assurance de ${vehicle.brand} ${vehicle.model} (${vehicle.registration}) est expirée depuis le ${vehicle.insuranceExpiry.toISOString().slice(0, 10)}.`,
          dueAt: vehicle.insuranceExpiry,
          vehicleId: vehicle.id,
          link: `/vehicles/${vehicle.id}`,
        });
      } else if (diff <= windowMs) {
        await this.upsertAlert({
          tenantId,
          type: 'INSURANCE_EXPIRY',
          severity: 'WARNING',
          title: `Assurance à renouveler · ${vehicle.registration}`,
          message: `L'assurance expire le ${vehicle.insuranceExpiry.toISOString().slice(0, 10)}.`,
          dueAt: vehicle.insuranceExpiry,
          vehicleId: vehicle.id,
          link: `/vehicles/${vehicle.id}`,
        });
      } else {
        await this.resolveMatching(tenantId, 'INSURANCE_EXPIRY', { vehicleId: vehicle.id });
      }
    }

    // Technical visit
    if (vehicle.technicalVisitExpiry) {
      const diff = vehicle.technicalVisitExpiry.getTime() - now;
      if (diff <= 0) {
        await this.upsertAlert({
          tenantId,
          type: 'TECHNICAL_VISIT_EXPIRY',
          severity: 'CRITICAL',
          title: `Visite technique expirée · ${vehicle.registration}`,
          message: `La visite technique est expirée depuis le ${vehicle.technicalVisitExpiry.toISOString().slice(0, 10)}.`,
          dueAt: vehicle.technicalVisitExpiry,
          vehicleId: vehicle.id,
          link: `/vehicles/${vehicle.id}`,
        });
      } else if (diff <= windowMs) {
        await this.upsertAlert({
          tenantId,
          type: 'TECHNICAL_VISIT_EXPIRY',
          severity: 'WARNING',
          title: `Visite technique à prévoir · ${vehicle.registration}`,
          message: `La visite technique expire le ${vehicle.technicalVisitExpiry.toISOString().slice(0, 10)}.`,
          dueAt: vehicle.technicalVisitExpiry,
          vehicleId: vehicle.id,
          link: `/vehicles/${vehicle.id}`,
        });
      } else {
        await this.resolveMatching(tenantId, 'TECHNICAL_VISIT_EXPIRY', { vehicleId: vehicle.id });
      }
    }

    // Vignette
    if (vehicle.vignetteExpiry) {
      const diff = vehicle.vignetteExpiry.getTime() - now;
      if (diff <= 0) {
        await this.upsertAlert({
          tenantId,
          type: 'VIGNETTE_EXPIRY',
          severity: 'WARNING',
          title: `Vignette expirée · ${vehicle.registration}`,
          message: `La vignette est expirée depuis le ${vehicle.vignetteExpiry.toISOString().slice(0, 10)}.`,
          dueAt: vehicle.vignetteExpiry,
          vehicleId: vehicle.id,
          link: `/vehicles/${vehicle.id}`,
        });
      } else if (diff <= windowMs) {
        await this.upsertAlert({
          tenantId,
          type: 'VIGNETTE_EXPIRY',
          severity: 'INFO',
          title: `Vignette à renouveler · ${vehicle.registration}`,
          message: `La vignette expire le ${vehicle.vignetteExpiry.toISOString().slice(0, 10)}.`,
          dueAt: vehicle.vignetteExpiry,
          vehicleId: vehicle.id,
          link: `/vehicles/${vehicle.id}`,
        });
      } else {
        await this.resolveMatching(tenantId, 'VIGNETTE_EXPIRY', { vehicleId: vehicle.id });
      }
    }

    // Maintenance schedules
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: { tenantId, vehicleId: vehicle.id, status: 'SCHEDULED' },
    });

    for (const s of schedules) {
      const overdueByDate = s.dueDate ? s.dueDate.getTime() < now : false;
      const overdueByKm =
        s.dueKm !== null && s.dueKm !== undefined ? vehicle.currentKm > s.dueKm : false;
      const soonByDate =
        s.dueDate && !overdueByDate
          ? s.dueDate.getTime() - now <= windowMs
          : false;

      if (overdueByDate || overdueByKm) {
        await this.upsertAlert({
          tenantId,
          type: 'MAINTENANCE_OVERDUE',
          severity: s.isCritical ? 'CRITICAL' : 'WARNING',
          title: `Entretien en retard · ${vehicle.registration}`,
          message: `${s.title} — ${s.isCritical ? 'critique. ' : ''}${
            overdueByKm ? `Kilométrage dépassé (${vehicle.currentKm} / ${s.dueKm} km). ` : ''
          }${
            overdueByDate && s.dueDate
              ? `Échéance : ${s.dueDate.toISOString().slice(0, 10)}.`
              : ''
          }`,
          dueAt: s.dueDate,
          vehicleId: vehicle.id,
          scheduleId: s.id,
          link: `/maintenance`,
        });
      } else if (soonByDate) {
        await this.upsertAlert({
          tenantId,
          type: 'MAINTENANCE_DUE',
          severity: 'INFO',
          title: `Entretien à prévoir · ${vehicle.registration}`,
          message: `${s.title} — échéance ${s.dueDate!.toISOString().slice(0, 10)}.`,
          dueAt: s.dueDate,
          vehicleId: vehicle.id,
          scheduleId: s.id,
          link: `/maintenance`,
        });
      } else {
        await this.resolveMatching(tenantId, 'MAINTENANCE_OVERDUE', {
          vehicleId: vehicle.id,
          scheduleId: s.id,
        });
        await this.resolveMatching(tenantId, 'MAINTENANCE_DUE', {
          vehicleId: vehicle.id,
          scheduleId: s.id,
        });
      }
    }
  }

  async syncInvoiceAlerts(tenantId: string, invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) return;

    const isOverdue =
      invoice.dueDate &&
      invoice.dueDate.getTime() < Date.now() &&
      (invoice.status === 'ISSUED' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE');

    if (isOverdue) {
      await this.upsertAlert({
        tenantId,
        type: 'INVOICE_OVERDUE',
        severity: 'CRITICAL',
        title: `Facture en retard · ${invoice.invoiceNumber}`,
        message: `Facture ${invoice.invoiceNumber} échue le ${invoice.dueDate!.toISOString().slice(0, 10)}, solde ${Number(invoice.balance).toFixed(2)} MAD.`,
        dueAt: invoice.dueDate,
        invoiceId: invoice.id,
        link: `/invoices`,
      });
    } else {
      await this.resolveMatching(tenantId, 'INVOICE_OVERDUE', { invoiceId: invoice.id });
    }
  }

  async syncCreditAlerts(tenantId: string, creditId: string): Promise<void> {
    const credit = await this.prisma.vehicleCredit.findFirst({
      where: { id: creditId, tenantId },
    });
    if (!credit || credit.status !== 'ACTIVE') return;

    const nextInstallment = await this.prisma.vehicleCreditPayment.findFirst({
      where: { tenantId, creditId, status: 'SCHEDULED' },
      orderBy: { scheduledDate: 'asc' },
    });
    if (!nextInstallment) {
      await this.resolveMatching(tenantId, 'CREDIT_PAYMENT_DUE', { creditId: credit.id });
      return;
    }

    const diff = nextInstallment.scheduledDate.getTime() - Date.now();
    const windowMs = 10 * DAY_MS; // alert 10 days before due

    if (diff <= 0) {
      await this.upsertAlert({
        tenantId,
        type: 'CREDIT_PAYMENT_DUE',
        severity: 'CRITICAL',
        title: `Échéance de crédit en retard · ${credit.bankName}`,
        message: `Installment ${nextInstallment.installmentNumber} échu le ${nextInstallment.scheduledDate.toISOString().slice(0, 10)}, ${Number(nextInstallment.scheduledAmount).toFixed(2)} MAD.`,
        dueAt: nextInstallment.scheduledDate,
        creditId: credit.id,
        link: `/credits/${credit.id}`,
      });
    } else if (diff <= windowMs) {
      await this.upsertAlert({
        tenantId,
        type: 'CREDIT_PAYMENT_DUE',
        severity: 'WARNING',
        title: `Échéance de crédit à venir · ${credit.bankName}`,
        message: `Prochaine échéance le ${nextInstallment.scheduledDate.toISOString().slice(0, 10)}, ${Number(nextInstallment.scheduledAmount).toFixed(2)} MAD.`,
        dueAt: nextInstallment.scheduledDate,
        creditId: credit.id,
        link: `/credits/${credit.id}`,
      });
    } else {
      await this.resolveMatching(tenantId, 'CREDIT_PAYMENT_DUE', { creditId: credit.id });
    }
  }

  /// Full resync for an entire tenant — used on a manual trigger or future cron.
  async syncAll(tenantId: string): Promise<{
    vehicles: number;
    invoices: number;
    credits: number;
  }> {
    const [vehicles, invoices, credits] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId, status: { in: ['ISSUED', 'PARTIAL', 'OVERDUE'] } },
        select: { id: true },
      }),
      this.prisma.vehicleCredit.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true },
      }),
    ]);

    for (const v of vehicles) await this.syncVehicleAlerts(tenantId, v.id);
    for (const i of invoices) await this.syncInvoiceAlerts(tenantId, i.id);
    for (const c of credits) await this.syncCreditAlerts(tenantId, c.id);

    this.logger.log(
      `Resynced tenant ${tenantId}: ${vehicles.length} vehicles, ${invoices.length} invoices, ${credits.length} credits`,
    );

    return {
      vehicles: vehicles.length,
      invoices: invoices.length,
      credits: credits.length,
    };
  }

  // ------------- Business-rule helper used by booking services -------------

  /**
   * Returns a non-empty array of blocker messages if the vehicle is unfit for
   * booking. Callers should throw a ConflictException when the array is non-empty.
   *
   * Blockers:
   * - expired insurance (always blocks)
   * - expired technical visit (always blocks)
   * - any CRITICAL maintenance schedule overdue
   */
  async getBookingBlockers(tenantId: string, vehicleId: string): Promise<string[]> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId, deletedAt: null },
    });
    if (!vehicle) return [`Vehicle ${vehicleId} not found`];

    const now = Date.now();
    const blockers: string[] = [];

    if (vehicle.insuranceExpiry && vehicle.insuranceExpiry.getTime() <= now) {
      blockers.push(
        `Insurance expired on ${vehicle.insuranceExpiry.toISOString().slice(0, 10)}`,
      );
    }
    if (
      vehicle.technicalVisitExpiry &&
      vehicle.technicalVisitExpiry.getTime() <= now
    ) {
      blockers.push(
        `Technical visit expired on ${vehicle.technicalVisitExpiry.toISOString().slice(0, 10)}`,
      );
    }

    const criticalOverdue = await this.prisma.maintenanceSchedule.findMany({
      where: {
        tenantId,
        vehicleId,
        status: 'SCHEDULED',
        isCritical: true,
        OR: [
          { dueDate: { lt: new Date(now) } },
          { dueKm: { lt: vehicle.currentKm } },
        ],
      },
    });

    for (const s of criticalOverdue) {
      blockers.push(`Critical maintenance overdue: ${s.title}`);
    }

    return blockers;
  }
}
