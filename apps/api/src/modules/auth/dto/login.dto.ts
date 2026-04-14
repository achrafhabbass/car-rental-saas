import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  /// Optional: tenantId (for ambiguous logins, e.g. super-admin picking a tenant)
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
