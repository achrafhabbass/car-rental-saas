import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipEnvelope } from '../../common/decorators/skip-envelope.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportService } from '../exports/export.service';
import type { ExportData } from '../exports/export.service';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@CurrentTenant() tenantId: string, @Query() query: ListClientsDto) {
    return this.clients.list(tenantId, query);
  }

  @SkipEnvelope()
  @Get('export')
  async export(
    @CurrentTenant() tenantId: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ): Promise<void> {
    const rows = await this.prisma.client.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const data: ExportData = {
      title: 'Clients',
      columns: [
        { header: 'Nom complet', key: 'fullName', width: 24 },
        { header: 'Type', key: 'type', width: 14 },
        { header: 'Email', key: 'email', width: 24 },
        { header: 'Téléphone', key: 'phone', width: 16 },
        { header: 'CIN', key: 'idNumber', width: 16 },
        { header: 'Permis', key: 'licenseNumber', width: 16 },
        { header: 'Segment', key: 'segment', width: 14 },
        { header: 'Blacklisté', key: 'blacklisted', width: 12 },
      ],
      rows: rows.map((c) => ({
        fullName: c.fullName,
        type: c.type,
        email: c.email ?? '',
        phone: c.phone ?? '',
        idNumber: c.idNumber,
        licenseNumber: c.licenseNumber ?? '',
        segment: c.segment,
        blacklisted: c.blacklisted ? 'Oui' : 'Non',
      })),
    };

    if (format === 'pdf') {
      const stream = this.exportService.toPdf(data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="clients.pdf"');
      res.setHeader('Cache-Control', 'no-store');
      stream.pipe(res);
    } else {
      const buffer = await this.exportService.toExcel(data);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'attachment; filename="clients.xlsx"');
      res.setHeader('Cache-Control', 'no-store');
      res.send(buffer);
    }
  }

  @Get(':id')
  get(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.clients.get(tenantId, id);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateClientDto) {
    return this.clients.create(tenantId, dto);
  }

  @Roles('ADMIN', 'MANAGER', 'EMPLOYEE')
  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clients.update(tenantId, id, dto);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.clients.delete(tenantId, id);
  }
}
