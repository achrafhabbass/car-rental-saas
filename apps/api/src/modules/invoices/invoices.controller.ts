import {
  Body,
  Controller,
  Get,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportService } from '../exports/export.service';
import type { ExportData } from '../exports/export.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListInvoicesDto) {
    return this.invoices.list(tenantId, query);
  }

  @SkipEnvelope()
  @Get('export')
  async export(
    @CurrentTenant() tenantId: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ): Promise<void> {
    const rows = await this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    });

    const fmtDate = (d: Date | null | undefined) =>
      d ? d.toLocaleDateString('fr-FR') : '';

    const data: ExportData = {
      title: 'Factures',
      columns: [
        { header: 'N° Facture', key: 'invoiceNumber', width: 18 },
        { header: 'Client', key: 'client', width: 24 },
        { header: 'Montant', key: 'total', width: 14 },
        { header: 'Statut', key: 'status', width: 14 },
        { header: 'Date émission', key: 'issueDate', width: 16 },
        { header: 'Date échéance', key: 'dueDate', width: 16 },
      ],
      rows: rows.map((inv: any) => ({
        invoiceNumber: inv.invoiceNumber,
        client: inv.client?.fullName ?? '',
        total: Number(inv.total),
        status: inv.status,
        issueDate: fmtDate(inv.issueDate),
        dueDate: fmtDate(inv.dueDate),
      })),
    };

    if (format === 'pdf') {
      const stream = this.exportService.toPdf(data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="factures.pdf"');
      res.setHeader('Cache-Control', 'no-store');
      stream.pipe(res);
    } else {
      const buffer = await this.exportService.toExcel(data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="factures.xlsx"');
      res.setHeader('Cache-Control', 'no-store');
      res.send(buffer);
    }
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.get(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(tenantId, dto);
  }
}
