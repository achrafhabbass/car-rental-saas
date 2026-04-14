import { Injectable } from '@nestjs/common';
import type { Prisma, Reservation } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReservationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<Reservation | null> {
    return this.prisma.reservation.findFirst({ where: { id, tenantId } });
  }

  list(
    tenantId: string,
    where: Prisma.ReservationWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.ReservationOrderByWithRelationInput,
  ): Promise<[Reservation[], number]> {
    const fullWhere: Prisma.ReservationWhereInput = { ...where, tenantId };
    return Promise.all([
      this.prisma.reservation.findMany({
        where: fullWhere,
        skip,
        take,
        orderBy: orderBy ?? { startDate: 'desc' },
        include: { vehicle: true, client: true },
      }),
      this.prisma.reservation.count({ where: fullWhere }),
    ]);
  }

  create(data: Prisma.ReservationUncheckedCreateInput): Promise<Reservation> {
    return this.prisma.reservation.create({ data });
  }

  update(
    tenantId: string,
    id: string,
    data: Prisma.ReservationUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.reservation.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  /// Generates the next reservation code scoped to the tenant: RES-YYYY-NNNN.
  async generateCode(tenantId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `RES-${year}-`;
    const last = await this.prisma.reservation.findFirst({
      where: { tenantId, reservationCode: { startsWith: prefix } },
      orderBy: { reservationCode: 'desc' },
      select: { reservationCode: true },
    });
    const nextN = last ? parseInt(last.reservationCode.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${nextN.toString().padStart(4, '0')}`;
  }
}
