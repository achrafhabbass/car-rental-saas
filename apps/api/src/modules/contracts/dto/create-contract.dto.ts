import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { DepositMethod } from '@prisma/client';

export class CreateContractDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  clientId!: string;

  @IsOptional()
  @IsUUID()
  reservationId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmStart!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmAllowance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dailyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsEnum(DepositMethod)
  depositMethod?: DepositMethod;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  depositReference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  returnLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  additionalDriver?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  additionalDriverLicense?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
