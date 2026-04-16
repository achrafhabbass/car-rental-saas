import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CompleteContractDto {
  @IsOptional()
  @IsDateString()
  actualReturnDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  kmEnd!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extraCharges?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
