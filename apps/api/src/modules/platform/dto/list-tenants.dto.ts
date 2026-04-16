import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TenantPlan, TenantStatus } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListTenantsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @IsOptional()
  @IsString()
  q?: string;
}
