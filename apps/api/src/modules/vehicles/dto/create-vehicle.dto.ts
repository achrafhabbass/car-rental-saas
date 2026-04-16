import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { VehicleFuel, VehicleTransmission } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  registration!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  brand!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  vin?: string;

  @IsOptional()
  @IsEnum(VehicleTransmission)
  transmission?: VehicleTransmission;

  @IsOptional()
  @IsEnum(VehicleFuel)
  fuel?: VehicleFuel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  seats?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentKm?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dailyRate!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weeklyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyRate?: number;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsDateString()
  technicalVisitExpiry?: string;

  @IsOptional()
  @IsDateString()
  vignetteExpiry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
