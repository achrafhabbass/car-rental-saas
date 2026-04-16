import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  /** Public endpoint — no auth required. Rate-limited by global throttle. */
  @Public()
  @Post('demo')
  @HttpCode(HttpStatus.CREATED)
  requestDemo(@Body() dto: CreateDemoRequestDto) {
    return this.leads.create(dto);
  }

  /** Public contact form — same as demo but different source. */
  @Public()
  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  contact(@Body() dto: CreateDemoRequestDto) {
    return this.leads.create({ ...dto, source: 'contact' } as any);
  }

  // ── Admin endpoints ──

  @AllowNoTenant()
  @Roles('SUPER_ADMIN')
  @Get()
  list(@Query('status') status?: string) {
    return this.leads.list(status);
  }

  @AllowNoTenant()
  @Roles('SUPER_ADMIN')
  @Get('stats')
  stats() {
    return this.leads.getStats();
  }

  @AllowNoTenant()
  @Roles('SUPER_ADMIN')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: LeadStatus; notes?: string },
  ) {
    return this.leads.updateStatus(id, body.status, body.notes);
  }
}
