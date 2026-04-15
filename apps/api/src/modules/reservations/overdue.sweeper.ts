import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ReservationsRepository } from './reservations.repository';

/**
 * Daily sweep that flips overdue reservations to the OVERDUE status and
 * fans out a notification ("Retour du véhicule en retard…") to each
 * tenant's ADMIN/MANAGER users.
 *
 * Idempotent: only reservations still in PENDING/CONFIRMED whose endDate
 * is in the past are touched, and `overdueSince` is set the first time
 * a sweep catches a row so repeated sweeps do not duplicate notifications.
 *
 * Default schedule: every day at 03:00. Trigger manually via
 * `POST /reservations/overdue/sweep` (ADMIN/MANAGER) for testing.
 */
@Injectable()
export class OverdueReservationsSweeper {
  private readonly logger = new Logger(OverdueReservationsSweeper.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: ReservationsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runDaily(): Promise<void> {
    await this.sweep();
    await this.sweepContracts();
    await this.sweepTenantSubscriptions();
  }

  /// Marks any TRIAL/ACTIVE tenant whose trialEndsAt or subscriptionEnd is
  /// in the past as EXPIRED. From that point onwards, AuthService.login
  /// refuses to grant tokens to any non-SUPER_ADMIN user belonging to that
  /// tenant. Idempotent: re-running the same day is safe.
  async sweepTenantSubscriptions(): Promise<{ expired: number }> {
    const now = new Date();
    const result = await this.prisma.tenant.updateMany({
      where: {
        deletedAt: null,
        OR: [
          { status: 'TRIAL', trialEndsAt: { lt: now } },
          { status: 'ACTIVE', subscriptionEnd: { lt: now } },
        ],
      },
      data: { status: 'EXPIRED' },
    });
    if (result.count > 0) {
      this.logger.log(
        `Tenant subscription sweep: ${result.count} tenant(s) marked EXPIRED`,
      );
    }
    return { expired: result.count };
  }

  /// Same idea as sweep() but for ACTIVE contracts whose endDate has passed
  /// without an actualReturnDate. Flips them to OVERDUE and notifies admins.
  async sweepContracts(): Promise<{ marked: number; notified: number }> {
    const candidates = await this.prisma.rentalContract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() },
        actualReturnDate: null,
      },
      include: {
        vehicle: { select: { registration: true } },
        client: { select: { fullName: true } },
      },
    });
    if (candidates.length === 0) {
      this.logger.debug('No overdue contracts to mark');
      return { marked: 0, notified: 0 };
    }
    let marked = 0;
    let notified = 0;
    for (const c of candidates) {
      const u = await this.prisma.rentalContract.updateMany({
        where: { id: c.id, status: 'ACTIVE' },
        data: { status: 'OVERDUE' },
      });
      if (u.count === 0) continue;
      marked += u.count;
      await this.notifications.broadcastToAdmins({
        tenantId: c.tenantId,
        title: `Contrat en retard · ${c.vehicle.registration}`,
        body: `Contrat ${c.contractNumber} (client ${c.client.fullName}) en retard depuis le ${c.endDate.toISOString().slice(0, 10)}. Veuillez contacter le client.`,
        link: `/contracts/${c.id}`,
      });
      notified += 1;
    }
    this.logger.log(`Overdue contract sweep: ${marked} marked, ${notified} notifications`);
    return { marked, notified };
  }

  async sweep(): Promise<{ marked: number; notified: number }> {
    const candidates = await this.repo.findOverdueCandidates();
    if (candidates.length === 0) {
      this.logger.debug('No overdue reservations to mark');
      return { marked: 0, notified: 0 };
    }

    let marked = 0;
    let notified = 0;
    for (const r of candidates) {
      // First time we sweep this row → flip + notify. On subsequent sweeps
      // status is already OVERDUE so it falls out of `findOverdueCandidates`.
      const updated = await this.prisma.reservation.updateMany({
        where: {
          id: r.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: { status: 'OVERDUE', overdueSince: new Date() },
      });
      if (updated.count === 0) continue;
      marked += updated.count;

      const reg = (r as unknown as { vehicle?: { registration?: string } }).vehicle?.registration ?? '—';
      const clientName =
        (r as unknown as { client?: { fullName?: string } }).client?.fullName ?? '—';

      await this.notifications.broadcastToAdmins({
        tenantId: r.tenantId,
        title: `Retour du véhicule en retard · ${reg}`,
        body: `Réservation ${r.reservationCode} (client ${clientName}) en retard depuis le ${r.endDate.toISOString().slice(0, 10)}. Veuillez contacter le client.`,
        link: `/reservations/${r.id}`,
      });
      notified += 1;
    }

    this.logger.log(`Overdue sweep: ${marked} reservations marked, ${notified} notifications sent`);
    return { marked, notified };
  }
}
