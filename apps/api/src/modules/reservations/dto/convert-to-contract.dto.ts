import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DepositMethod } from '@prisma/client';

export class ConvertReservationToContractDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmStart!: number;

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
}
