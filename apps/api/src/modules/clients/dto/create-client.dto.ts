import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ClientSegment, ClientType } from '@prisma/client';

export class CreateClientDto {
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  idNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  idType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  licenseNumber?: string;

  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nationality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  country?: string;

  @IsOptional()
  @IsEnum(ClientSegment)
  segment?: ClientSegment;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
