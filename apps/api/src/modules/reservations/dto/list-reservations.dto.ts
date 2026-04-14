import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListReservationsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
