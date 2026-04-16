import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Payment, Prisma } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { NotificationService } from '../mail/notification.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { PaymentsRepository } from './payments.repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly alerts: AlertsService,
    private readonly notifications: NotificationService,
  ) {}

  async list(tenantId: string, dto: ListPaymentsDto): Promise<PaginatedResult<Payment>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.PaymentWhereInput = {};
    if (dto.status) where.status = dto.status;
    if (dto.method) where.method = dto.method;
    if (dto.contractId) where.contractId = dto.contractId;
    if (dto.invoiceId) where.invoiceId = dto.invoiceId;
    if (dto.clientId) where.clientId = dto.clientId;
    if (dto.search) {
      where.OR = [
        { paymentCode: { contains: dto.search, mode: 'insensitive' } },
        { reference: { contains: dto.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.repo.list(tenantId, where, skip, take, orderBy);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<Payment> {
    const p = await this.repo.findById(tenantId, id);
    if (!p) throw new NotFoundException(`Payment ${id} not found`);
    return p;
  }

  async create(tenantId: string, dto: CreatePaymentDto): Promise<Payment> {
    if (dto.amount <= 0) {
      throw new BadRequestException('amount must be positive');
    }

    // Validate cross-references
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId },
    });
    if (!client) throw new NotFoundException(`Client ${dto.clientId} not found`);

    if (dto.contractId) {
      const contract = await this.prisma.rentalContract.findFirst({
        where: { id: dto.contractId, tenantId },
      });
      if (!contract) throw new NotFoundException(`Contract ${dto.contractId} not found`);
    }

    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, tenantId },
      });
      if (!invoice) throw new NotFoundException(`Invoice ${dto.invoiceId} not found`);
    }

    const paymentCode = await this.repo.generateCode(tenantId);

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          paymentCode,
          clientId: dto.clientId,
          contractId: dto.contractId,
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          method: dto.method ?? 'CASH',
          reference: dto.reference,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          notes: dto.notes,
          status: 'CONFIRMED',
        },
      });

      // If invoice, update its amountPaid/balance/status
      if (dto.invoiceId) {
        const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: dto.invoiceId } });
        const newPaid = Number(invoice.amountPaid) + dto.amount;
        const newBalance = Number(invoice.total) - newPaid;
        const status =
          newBalance <= 0.009
            ? 'PAID'
            : newPaid > 0
              ? 'PARTIAL'
              : invoice.status;
        await tx.invoice.update({
          where: { id: dto.invoiceId },
          data: {
            amountPaid: newPaid,
            balance: Math.max(newBalance, 0),
            status,
            paidAt: status === 'PAID' ? new Date() : invoice.paidAt,
          },
        });
      }

      return payment;
    });

    if (dto.invoiceId) {
      await this.alerts.syncInvoiceAlerts(tenantId, dto.invoiceId);
    }
    void this.notifications.onPaymentReceived(result.id);

    return result;
  }
}
