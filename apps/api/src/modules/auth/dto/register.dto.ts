import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/// Registers a new tenant + its owner user in one atomic operation.
export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  companyName!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be kebab-case lowercase' })
  @MinLength(3)
  @MaxLength(64)
  companySlug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lastName!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
