import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import {
  FuelLevel,
  InspectionStatus,
  InspectionType,
  VehicleConditionRating,
} from '@prisma/client';

export class CreateInspectionDto {
  @IsUUID()
  contractId!: string;

  @IsEnum(InspectionType)
  type!: InspectionType;

  @IsOptional()
  @IsDateString()
  performedAt?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  km!: number;

  @IsOptional()
  @IsEnum(FuelLevel)
  fuelLevel?: FuelLevel;

  @IsOptional()
  @IsEnum(VehicleConditionRating)
  condition?: VehicleConditionRating;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  damages?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  photos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  agentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;
}
