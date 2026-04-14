import { Injectable } from '@nestjs/common';
import type { Prisma, VehicleCredit, VehicleCreditPayment } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehicleCreditsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<VehicleCredit | null> {
    return this.prisma.vehicleCredit.findFirst({
      where: { id, tenantId },
      include: { vehicle: true },
    });
  }

  list(
    tenantId: string,
    where: Prisma.VehicleCreditWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.VehicleCreditOrderByWithRelationInput,
  ): Promise<[VehicleCredit[], number]> {
    const full: Prisma.VehicleCreditWhereInput = { ...where, tenantId };
    return Promise.all([
      this.prisma.vehicleCredit.findMany({
        where: full,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { vehicle: true },
      }),
      this.prisma.vehicleCredit.count({ where: full }),
    ]);
  }

  schedule(tenantId: string, creditId: string): Promise<VehicleCreditPayment[]> {
    return this.prisma.vehicleCreditPayment.findMany({
      where: { tenantId, creditId },
      orderBy: { installmentNumber: 'asc' },
    });
  }

  findPaymentById(
    tenantId: string,
    paymentId: string,
  ): Promise<VehicleCreditPayment | null> {
    return this.prisma.vehicleCreditPayment.findFirst({
      where: { id: paymentId, tenantId },
    });
  }
}
