import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ReservationPaymentStatus, ReservationSource } from '@prisma/client';

export class CreateReservationDto {
  @IsUUID()
  vehicleId!: string;

  @IsUUID()
  clientId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  returnLocation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dailyRate?: number;

  @IsOptional()
  @IsEnum(ReservationSource)
  source?: ReservationSource;

  @IsOptional()
  @IsEnum(ReservationPaymentStatus)
  paymentStatus?: ReservationPaymentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
