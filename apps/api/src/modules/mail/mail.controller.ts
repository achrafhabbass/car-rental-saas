import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

import { AllowNoTenant } from '../../common/decorators/allow-no-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { MailService } from './mail.service';

class TestEmailDto {
  @IsEmail()
  to!: string;
}

@ApiTags('Email')
@Controller('platform/system/email')
@AllowNoTenant()
@Roles('SUPER_ADMIN')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('test')
  testEmail(@Body() dto: TestEmailDto) {
    return this.mail.sendTest(dto.to);
  }

  @Get('logs')
  getLogs(@Query('limit') limit?: string) {
    const n = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
    return this.mail.getLogs(n);
  }

  @Get('stats')
  getStats() {
    return this.mail.getStats();
  }
}
