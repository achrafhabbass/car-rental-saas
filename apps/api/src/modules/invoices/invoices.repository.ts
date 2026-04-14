import { Injectable } from '@nestjs/common';
import type { Invoice, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { client: true, contract: true, payments: true },
    });
  }

  list(
    tenantId: string,
    where: Prisma.InvoiceWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.InvoiceOrderByWithRelationInput,
  ): Promise<[Invoice[], number]> {
    const full: Prisma.InvoiceWhereInput = { ...where, tenantId };
    return Promise.all([
      this.prisma.invoice.findMany({
        where: full,
        skip,
        take,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: { client: true, contract: true },
      }),
      this.prisma.invoice.count({ where: full }),
    ]);
  }

  create(data: Prisma.InvoiceUncheckedCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({ data });
  }

  update(tenantId: string, id: string, data: Prisma.InvoiceUpdateInput): Promise<Prisma.BatchPayload> {
    return this.prisma.invoice.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async generateNumber(tenantId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `FACT-${year}-`;
    const last = await this.prisma.invoice.findFirst({
      where: { tenantId, invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    const n = last ? parseInt(last.invoiceNumber.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${n.toString().padStart(4, '0')}`;
  }
}
