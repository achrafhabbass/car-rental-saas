import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Invoice, Prisma } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { InvoicesRepository } from './invoices.repository';

const DEFAULT_TAX_RATE = 20; // Morocco TVA
const DEFAULT_DUE_DAYS = 30;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly repo: InvoicesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(tenantId: string, dto: ListInvoicesDto): Promise<PaginatedResult<Invoice>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.InvoiceWhereInput = {};
    if (dto.status) where.status = dto.status;
    if (dto.clientId) where.clientId = dto.clientId;
    if (dto.contractId) where.contractId = dto.contractId;
    if (dto.search) where.invoiceNumber = { contains: dto.search, mode: 'insensitive' };
    const [items, total] = await this.repo.list(tenantId, where, skip, take, orderBy);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<Invoice> {
    const inv = await this.repo.findById(tenantId, id);
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`);
    return inv;
  }

  async create(tenantId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    if (!dto.lineItems.length) {
      throw new BadRequestException('At least one line item is required');
    }

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

    const subtotal = dto.lineItems.reduce((acc, li) => acc + Number(li.total), 0);
    const taxRate = dto.taxRate ?? DEFAULT_TAX_RATE;
    const taxAmount = +(subtotal * taxRate / 100).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    const issue = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const due = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(issue.getTime() + DEFAULT_DUE_DAYS * 24 * 60 * 60 * 1000);

    const invoiceNumber = await this.repo.generateNumber(tenantId);

    return this.repo.create({
      tenantId,
      invoiceNumber,
      clientId: dto.clientId,
      contractId: dto.contractId,
      issueDate: issue,
      dueDate: due,
      subtotal: subtotal.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      amountPaid: '0.00',
      balance: total.toFixed(2),
      status: 'ISSUED',
      lineItems: dto.lineItems as unknown as Prisma.InputJsonValue,
      notes: dto.notes,
    });
  }

  async markOverdueIfNeeded(tenantId: string, id: string): Promise<void> {
    const inv = await this.get(tenantId, id);
    if (inv.status === 'ISSUED' || inv.status === 'PARTIAL') {
      if (inv.dueDate && new Date() > new Date(inv.dueDate)) {
        await this.repo.update(tenantId, id, { status: 'OVERDUE' });
      }
    }
  }
}
