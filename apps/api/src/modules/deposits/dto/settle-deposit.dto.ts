import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Body for partial-refund / consume / refund-full operations.
 * - refund-full: no body needed; full remaining is returned to client.
 * - refund-partial: `amount` = euros refunded; remainder stays held.
 * - consume: `amount` = euros kept by the company.
 */
export class SettleDepositDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
