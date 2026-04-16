import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CreditType } from '@prisma/client';

export class CreateCreditDto {
  @IsUUID()
  vehicleId!: string;

  @IsString()
  @MaxLength(255)
  bankName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  accountNumber?: string;

  @IsOptional()
  @IsEnum(CreditType)
  creditType?: CreditType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  principal!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  downPayment?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  interestRate!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  termMonths!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  residualValue?: number;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
