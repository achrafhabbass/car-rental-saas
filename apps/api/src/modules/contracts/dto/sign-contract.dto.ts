import { IsString, IsUrl, MaxLength } from 'class-validator';

export class SignContractDto {
  /** Secure URL of the signature PNG, issued by POST /uploads (kind=signature). */
  @IsString()
  @IsUrl()
  @MaxLength(512)
  signatureUrl!: string;
}
