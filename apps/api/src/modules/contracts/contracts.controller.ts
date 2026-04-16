import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportService } from '../exports/export.service';
import type { ExportData } from '../exports/export.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ContractsService } from './contracts.service';
import { CompleteContractDto } from './dto/complete-contract.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsDto } from './dto/list-contracts.dto';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController {
  constructor(
    private readonly contracts: ContractsService,
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListContractsDto) {
    return this.contracts.list(tenantId, query);
  }

  @SkipEnvelope()
  @Get('export')
  async export(
    @CurrentTenant() tenantId: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ): Promise<void> {
    const rows = await this.prisma.rentalContract.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { client: true, vehicle: true },
    });

    const fmtDate = (d: Date | null) =>
      d ? d.toLocaleDateString('fr-FR') : '';

    const data: ExportData = {
      title: 'Contrats',
      columns: [
        { header: 'N° Contrat', key: 'contractNumber', width: 18 },
        { header: 'Client', key: 'client', width: 24 },
        { header: 'Véhicule', key: 'vehicle', width: 18 },
        { header: 'Début', key: 'startDate', width: 14 },
        { header: 'Fin', key: 'endDate', width: 14 },
        { header: 'Tarif/jour', key: 'dailyRate', width: 12 },
        { header: 'Total', key: 'totalAmount', width: 12 },
        { header: 'Statut', key: 'status', width: 14 },
      ],
      rows: rows.map((c: any) => ({
        contractNumber: c.contractNumber,
        client: c.client?.fullName ?? '',
        vehicle: c.vehicle?.registration ?? '',
        startDate: fmtDate(c.startDate),
        endDate: fmtDate(c.endDate),
        dailyRate: Number(c.dailyRate),
        totalAmount: Number(c.totalAmount),
        status: c.status,
      })),
    };

    if (format === 'pdf') {
      const stream = this.exportService.toPdf(data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="contrats.pdf"');
      res.setHeader('Cache-Control', 'no-store');
      stream.pipe(res);
    } else {
      const buffer = await this.exportService.toExcel(data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="contrats.xlsx"');
      res.setHeader('Cache-Control', 'no-store');
      res.send(buffer);
    }
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.get(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateContractDto,
  ) {
    return this.contracts.create(tenantId, user.sub, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post(':id/complete')
  complete(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteContractDto,
  ) {
    return this.contracts.complete(tenantId, id, dto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/cancel')
  cancel(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.cancel(tenantId, id);
  }

  @SkipEnvelope()
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async pdf(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const stream = await this.contracts.generatePdfStream(tenantId, id);
    res.setHeader('Content-Disposition', `attachment; filename="contract-${id}.pdf"`);
    res.setHeader('Cache-Control', 'no-store');
    stream.pipe(res);
  }
}
