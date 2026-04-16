import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { VehicleStatus } from '@prisma/client';

export class CalendarQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
