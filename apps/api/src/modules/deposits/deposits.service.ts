import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Deposit, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CollectDepositDto } from './dto/collect-deposit.dto';
import { SettleDepositDto } from './dto/settle-deposit.dto';

@Injectable()
export class DepositsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, contractId?: string): Promise<Deposit[]> {
    return this.prisma.deposit.findMany({
      where: { tenantId, contractId },
      orderBy: { collectedAt: 'desc' },
    });
  }

  async get(tenantId: string, id: string): Promise<Deposit> {
    const d = await this.prisma.deposit.findFirst({ where: { id, tenantId } });
    if (!d) throw new NotFoundException(`Deposit ${id} not found`);
    return d;
  }

  async getForContract(
    tenantId: string,
    contractId: string,
  ): Promise<Deposit | null> {
    return this.prisma.deposit.findFirst({ where: { tenantId, contractId } });
  }

  async collect(tenantId: string, dto: CollectDepositDto): Promise<Deposit> {
    const contract = await this.prisma.rentalContract.findFirst({
      where: { id: dto.contractId, tenantId },
      select: { id: true, clientId: true },
    });
    if (!contract) throw new NotFoundException(`Contract ${dto.contractId} not found`);

    const existing = await this.prisma.deposit.findFirst({
      where: { tenantId, contractId: dto.contractId },
    });
    if (existing) {
      throw new ConflictException(
        `Contract ${dto.contractId} already has a deposit (${existing.depositNumber})`,
      );
    }

    const depositNumber = await this.generateNumber(tenantId);

    return this.prisma.deposit.create({
      data: {
        tenantId,
        depositNumber,
        contractId: dto.contractId,
        clientId: contract.clientId,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        notes: dto.notes,
        status: 'HELD',
      },
    });
  }

  async refundFull(tenantId: string, id: string, userId: string | null): Promise<Deposit> {
    const dep = await this.get(tenantId, id);
    if (dep.status !== 'HELD' && dep.status !== 'PARTIAL_REFUND') {
      throw new ConflictException(`Deposit is ${dep.status}, cannot refund`);
    }
    const remaining =
      Number(dep.amount) - Number(dep.refundedAmount) - Number(dep.consumedAmount);
    if (remaining <= 0) {
      throw new BadRequestException('Nothing to refund');
    }
    return this.prisma.deposit.update({
      where: { id: dep.id },
      data: {
        refundedAmount: Number(dep.refundedAmount) + remaining,
        status: 'REFUNDED',
        settledAt: new Date(),
        settledByUserId: userId,
      },
    });
  }

  async refundPartial(
    tenantId: string,
    id: string,
    userId: string | null,
    dto: SettleDepositDto,
  ): Promise<Deposit> {
    const dep = await this.get(tenantId, id);
    if (dep.status !== 'HELD' && dep.status !== 'PARTIAL_REFUND') {
      throw new ConflictException(`Deposit is ${dep.status}, cannot refund`);
    }
    const refundAmount = dto.amount ?? 0;
    if (refundAmount <= 0) throw new BadRequestException('amount must be positive');
    const remaining =
      Number(dep.amount) - Number(dep.refundedAmount) - Number(dep.consumedAmount);
    if (refundAmount > remaining) {
      throw new BadRequestException(
        `Cannot refund ${refundAmount}, only ${remaining} remaining`,
      );
    }
    const newRefunded = Number(dep.refundedAmount) + refundAmount;
    const newRemaining = remaining - refundAmount;
    const status = newRemaining <= 0.009 ? 'REFUNDED' : 'PARTIAL_REFUND';
    return this.prisma.deposit.update({
      where: { id: dep.id },
      data: {
        refundedAmount: newRefunded,
        status,
        settledAt: status === 'REFUNDED' ? new Date() : dep.settledAt,
        settledByUserId: status === 'REFUNDED' ? userId : dep.settledByUserId,
        notes: dto.notes ?? dep.notes,
      },
    });
  }

  async consume(
    tenantId: string,
    id: string,
    userId: string | null,
    dto: SettleDepositDto,
  ): Promise<Deposit> {
    const dep = await this.get(tenantId, id);
    if (dep.status !== 'HELD' && dep.status !== 'PARTIAL_REFUND') {
      throw new ConflictException(`Deposit is ${dep.status}, cannot consume`);
    }
    const remaining =
      Number(dep.amount) - Number(dep.refundedAmount) - Number(dep.consumedAmount);
    const consumeAmount = dto.amount ?? remaining;
    if (consumeAmount <= 0) throw new BadRequestException('Nothing to consume');
    if (consumeAmount > remaining) {
      throw new BadRequestException(
        `Cannot consume ${consumeAmount}, only ${remaining} remaining`,
      );
    }
    const newConsumed = Number(dep.consumedAmount) + consumeAmount;
    const newRemaining = remaining - consumeAmount;
    const fullyConsumed = newRemaining <= 0.009;
    const data: Prisma.DepositUpdateInput = {
      consumedAmount: newConsumed,
      notes: dto.notes ?? dep.notes,
    };
    if (fullyConsumed && Number(dep.refundedAmount) === 0) {
      data.status = 'CONSUMED';
      data.settledAt = new Date();
      data.settledByUserId = userId;
    } else if (fullyConsumed) {
      // Partly refunded then fully consumed remainder → PARTIAL_REFUND keeps
      data.status = 'PARTIAL_REFUND';
      data.settledAt = new Date();
      data.settledByUserId = userId;
    }
    return this.prisma.deposit.update({ where: { id: dep.id }, data });
  }

  private async generateNumber(tenantId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    const prefix = `DEP-${year}-`;
    const last = await this.prisma.deposit.findFirst({
      where: { tenantId, depositNumber: { startsWith: prefix } },
      orderBy: { depositNumber: 'desc' },
      select: { depositNumber: true },
    });
    const n = last ? parseInt(last.depositNumber.slice(prefix.length), 10) + 1 : 1;
    return `${prefix}${n.toString().padStart(4, '0')}`;
  }
}
