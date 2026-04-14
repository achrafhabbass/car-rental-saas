import { IsEnum, IsOptional } from 'class-validator';
import { VehicleStatus } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListVehiclesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
