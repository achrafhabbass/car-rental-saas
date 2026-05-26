import { IsEnum } from 'class-validator';
import { TenantPlan } from '@prisma/client';

export type BillingPeriod = 'monthly' | 'annual';

export class CreateCheckoutDto {
  @IsEnum(TenantPlan)
  plan!: TenantPlan;

  @IsEnum(['monthly', 'annual'])
  period!: BillingPeriod;
}
