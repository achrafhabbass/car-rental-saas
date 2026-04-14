import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, VehicleCredit, VehicleCreditPayment } from '@prisma/client';

import {
  PaginatedResult,
  buildPagination,
  paginate,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { buildAmortizationSchedule } from './amortization';
import { CreateCreditDto } from './dto/create-credit.dto';
import { ListCreditsDto } from './dto/list-credits.dto';
import { RecordCreditPaymentDto } from './dto/record-payment.dto';
import { VehicleCreditsRepository } from './vehicle-credits.repository';

@Injectable()
export class VehicleCreditsService {
  constructor(
    private readonly repo: VehicleCreditsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(
    tenantId: string,
    dto: ListCreditsDto,
  ): Promise<PaginatedResult<VehicleCredit>> {
    const { skip, take, orderBy } = buildPagination(dto);
    const where: Prisma.VehicleCreditWhereInput = {};
    if (dto.status) where.status = dto.status;
    if (dto.creditType) where.creditType = dto.creditType;
    if (dto.vehicleId) where.vehicleId = dto.vehicleId;
    if (dto.search) where.bankName = { contains: dto.search, mode: 'insensitive' };
    const [items, total] = await this.repo.list(tenantId, where, skip, take, orderBy);
    return paginate(items, total, dto);
  }

  async get(tenantId: string, id: string): Promise<VehicleCredit> {
    const c = await this.repo.findById(tenantId, id);
    if (!c) throw new NotFoundException(`Credit ${id} not found`);
    return c;
  }

  schedule(tenantId: string, id: string): Promise<VehicleCreditPayment[]> {
    return this.repo.schedule(tenantId, id);
  }

  async create(tenantId: string, dto: CreateCreditDto): Promise<VehicleCredit> {
    if (dto.termMonths <= 0) {
      throw new BadRequestException('termMonths must be > 0');
    }
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);

    const downPayment = dto.downPayment ?? 0;
    if (downPayment >= dto.principal) {
      throw new BadRequestException('downPayment must be less than principal');
    }

    const financed = dto.principal - downPayment;
    const start = new Date(dto.startDate);
    const { monthlyPayment, schedule } = buildAmortizationSchedule(
      financed,
      dto.interestRate,
      dto.termMonths,
      start,
    );

    const endDate = new Date(start);
    endDate.setUTCMonth(endDate.getUTCMonth() + dto.termMonths);

    return this.prisma.$transaction(async (tx) => {
      const credit = await tx.vehicleCredit.create({
        data: {
          tenantId,
          vehicleId: dto.vehicleId,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          creditType: dto.creditType ?? 'BANK_CREDIT',
          principal: dto.principal,
          downPayment,
          interestRate: dto.interestRate,
          termMonths: dto.termMonths,
          monthlyPayment,
          residualValue: dto.residualValue,
          startDate: start,
          endDate,
          remainingBalance: financed,
          totalPaid: 0,
          notes: dto.notes,
        },
      });

      await tx.vehicleCreditPayment.createMany({
        data: schedule.map((row) => ({
          tenantId,
          creditId: credit.id,
          installmentNumber: row.installmentNumber,
          scheduledDate: row.scheduledDate,
          scheduledAmount: row.scheduledAmount,
          principalPortion: row.principalPortion,
          interestPortion: row.interestPortion,
          status: 'SCHEDULED' as const,
        })),
      });

      return credit;
    });
  }

  async recordPayment(
    tenantId: string,
    creditId: string,
    paymentId: string,
    dto: RecordCreditPaymentDto,
  ): Promise<VehicleCreditPayment> {
    const credit = await this.get(tenantId, creditId);
    const installment = await this.repo.findPaymentById(tenantId, paymentId);
    if (!installment || installment.creditId !== creditId) {
      throw new NotFoundException(`Installment ${paymentId} not found`);
    }
    if (installment.status === 'PAID') {
      throw new BadRequestException('Installment already paid');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.vehicleCreditPayment.update({
        where: { id: installment.id },
        data: {
          status: 'PAID',
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          paidAmount: dto.paidAmount,
          reference: dto.reference,
          notes: dto.notes,
        },
      });

      const newTotalPaid = Number(credit.totalPaid) + dto.paidAmount;
      const newBalance = Math.max(0, Number(credit.remainingBalance) - Number(installment.principalPortion));
      const isPaidOff = newBalance <= 0.009;

      await tx.vehicleCredit.update({
        where: { id: credit.id },
        data: {
          totalPaid: newTotalPaid,
          remainingBalance: newBalance,
          status: isPaidOff ? 'PAID_OFF' : credit.status,
        },
      });

      return updated;
    });
  }
}
