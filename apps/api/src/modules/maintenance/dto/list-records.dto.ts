import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MaintenanceType } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListMaintenanceRecordsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;
}
