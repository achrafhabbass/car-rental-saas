import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MaintenanceType } from '@prisma/client';

export class CreateMaintenanceScheduleDto {
  @IsUUID()
  vehicleId!: string;

  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dueKm?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCritical?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
