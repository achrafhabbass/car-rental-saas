import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface BadgesDto {
  alerts: number;
  reservationsToday: number;
  contractsOverdue: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getBadges(tenantId: string): Promise<BadgesDto> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const [alerts, reservationsToday, contractsOverdue] = await Promise.all([
      this.prisma.alert.count({ where: { tenantId, status: 'OPEN' } }),
      this.prisma.reservation.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [
            { startDate: { gte: startOfDay, lt: endOfDay } },
            { endDate: { gte: startOfDay, lt: endOfDay } },
          ],
        },
      }),
      this.prisma.rentalContract.count({
        where: {
          tenantId,
          OR: [
            { status: 'OVERDUE' },
            { status: 'ACTIVE', endDate: { lt: now }, actualReturnDate: null },
          ],
        },
      }),
    ]);

    return { alerts, reservationsToday, contractsOverdue };
  }
}
