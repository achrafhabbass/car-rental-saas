import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const DATA_URL_RE = /^(?:|data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=\r\n]+)$/;

export class UpdateTenantSelfDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  billingEmail?: string;

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

  /**
   * Base64 data URL (data:image/png;base64,…). Pass an empty string to clear.
   * Hard-capped at ~1.4MB after encoding to keep the row reasonable.
   */
  @IsOptional()
  @IsString()
  @MaxLength(1_800_000)
  @Matches(DATA_URL_RE, { message: 'logoUrl must be a base64 image data URL' })
  logoUrl?: string;
}
