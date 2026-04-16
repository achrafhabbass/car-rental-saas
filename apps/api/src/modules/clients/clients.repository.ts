import { Injectable } from '@nestjs/common';
import type { Client, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<Client | null> {
    return this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  findByIdNumber(tenantId: string, idNumber: string): Promise<Client | null> {
    return this.prisma.client.findFirst({
      where: { tenantId, idNumber, deletedAt: null },
    });
  }

  list(
    tenantId: string,
    where: Prisma.ClientWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.ClientOrderByWithRelationInput,
  ): Promise<[Client[], number]> {
    const fullWhere: Prisma.ClientWhereInput = { ...where, tenantId, deletedAt: null };
    return Promise.all([
      this.prisma.client.findMany({
        where: fullWhere,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where: fullWhere }),
    ]);
  }

  create(data: Prisma.ClientUncheckedCreateInput): Promise<Client> {
    return this.prisma.client.create({ data });
  }

  update(tenantId: string, id: string, data: Prisma.ClientUpdateInput): Promise<Prisma.BatchPayload> {
    return this.prisma.client.updateMany({
      where: { id, tenantId, deletedAt: null },
      data,
    });
  }

  softDelete(tenantId: string, id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.client.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
