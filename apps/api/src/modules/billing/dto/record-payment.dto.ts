import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { SubscriptionPeriod, TenantPlan } from '@prisma/client';

export class RecordSubscriptionPaymentDto {
  @IsEnum(TenantPlan)
  plan!: TenantPlan;

  @IsEnum(SubscriptionPeriod)
  period!: SubscriptionPeriod;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @MaxLength(32)
  method!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reference?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
