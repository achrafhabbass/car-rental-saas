import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CreditStatus, CreditType } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListCreditsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CreditStatus)
  status?: CreditStatus;

  @IsOptional()
  @IsEnum(CreditType)
  creditType?: CreditType;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
