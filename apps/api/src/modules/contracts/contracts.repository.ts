import { Injectable } from '@nestjs/common';
import type { Prisma, RentalContract } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContractsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<RentalContract | null> {
    return this.prisma.rentalContract.findFirst({
      where: { id, tenantId },
      include: { vehicle: true, client: true },
    });
  }

  list(
    tenantId: string,
    where: Prisma.RentalContractWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.RentalContractOrderByWithRelationInput,
  ): Promise<[RentalContract[], number]> {
    const full: Prisma.RentalContractWhereInput = { ...where, tenantId };
    return Promise.all([
      this.prisma.rentalContract.findMany({
        where: full,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { vehicle: true, client: true },
      }),
      this.prisma.rentalContract.count({ where: full }),
    ]);
  }

  create(data: Prisma.RentalContractUncheckedCreateInput): Promise<RentalContract> {
    return this.prisma.rentalContract.create({ data });
  }

  update(
    tenantId: string,
    id: string,
    data: Prisma.RentalContractUpdateInput,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.rentalContract.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async generateContractNumber(tenantId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `CT-${year}-`;
    const last = await this.prisma.rentalContract.findFirst({
      where: { tenantId, contractNumber: { startsWith: prefix } },
      orderBy: { contractNumber: 'desc' },
      select: { contractNumber: true },
    });
    const nextN = last ? parseInt(last.contractNumber.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${nextN.toString().padStart(4, '0')}`;
  }
}
