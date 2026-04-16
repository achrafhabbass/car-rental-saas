import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InspectionType } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListInspectionsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsEnum(InspectionType)
  type?: InspectionType;
}
