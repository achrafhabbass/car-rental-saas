import { Injectable } from '@nestjs/common';
import type { Prisma, Vehicle } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByRegistration(tenantId: string, registration: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findFirst({
      where: { tenantId, registration, deletedAt: null },
    });
  }

  list(
    tenantId: string,
    where: Prisma.VehicleWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.VehicleOrderByWithRelationInput,
  ): Promise<[Vehicle[], number]> {
    const fullWhere: Prisma.VehicleWhereInput = { ...where, tenantId, deletedAt: null };
    return Promise.all([
      this.prisma.vehicle.findMany({
        where: fullWhere,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where: fullWhere }),
    ]);
  }

  create(data: Prisma.VehicleUncheckedCreateInput): Promise<Vehicle> {
    return this.prisma.vehicle.create({ data });
  }

  update(
    tenantId: string,
    id: string,
    data: Prisma.VehicleUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.vehicle.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
  }

  softDelete(tenantId: string, id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.vehicle.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  /// Returns true if another active (non-cancelled/completed) booking overlaps the given window.
  async hasOverlap(
    tenantId: string,
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
    excludeContractId?: string,
  ): Promise<boolean> {
    const [reservationCount, contractCount] = await Promise.all([
      this.prisma.reservation.count({
        where: {
          tenantId,
          vehicleId,
          id: excludeReservationId ? { not: excludeReservationId } : undefined,
          status: { in: ['PENDING', 'CONFIRMED'] },
          AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
        },
      }),
      this.prisma.rentalContract.count({
        where: {
          tenantId,
          vehicleId,
          id: excludeContractId ? { not: excludeContractId } : undefined,
          status: { in: ['DRAFT', 'ACTIVE'] },
          AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
        },
      }),
    ]);
    return reservationCount + contractCount > 0;
  }
}
