import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TenantPlan } from '@prisma/client';

export class UpdateTenantPlatformDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_800_000)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  ice?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  rc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  patente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cnss?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bankRib?: string;

  @IsOptional()
  @IsDateString()
  subscriptionEnd?: string;
}

export class ExtendTrialDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days!: number;
}

/// Either `days` (added to current subscriptionEnd) or `newEndDate`
/// (absolute new end). At least one is required — service enforces.
export class ExtendSubscriptionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  days?: number;

  @IsOptional()
  @IsDateString()
  newEndDate?: string;
}

export class SuspendTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
