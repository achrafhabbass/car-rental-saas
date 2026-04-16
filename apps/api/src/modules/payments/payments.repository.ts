import { Injectable } from '@nestjs/common';
import type { Payment, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(tenantId: string, id: string): Promise<Payment | null> {
    return this.prisma.payment.findFirst({ where: { id, tenantId } });
  }

  list(
    tenantId: string,
    where: Prisma.PaymentWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.PaymentOrderByWithRelationInput,
  ): Promise<[Payment[], number]> {
    const full: Prisma.PaymentWhereInput = { ...where, tenantId };
    return Promise.all([
      this.prisma.payment.findMany({
        where: full,
        skip,
        take,
        orderBy: orderBy ?? { paidAt: 'desc' },
        include: { client: true, contract: true, invoice: true },
      }),
      this.prisma.payment.count({ where: full }),
    ]);
  }

  create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return this.prisma.payment.create({ data });
  }

  async generateCode(tenantId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `PAY-${year}-`;
    const last = await this.prisma.payment.findFirst({
      where: { tenantId, paymentCode: { startsWith: prefix } },
      orderBy: { paymentCode: 'desc' },
      select: { paymentCode: true },
    });
    const n = last ? parseInt(last.paymentCode.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${n.toString().padStart(4, '0')}`;
  }

  async sumByInvoice(tenantId: string, invoiceId: string): Promise<number> {
    const agg = await this.prisma.payment.aggregate({
      where: { tenantId, invoiceId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  }
}
