import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListInvoicesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  contractId?: string;
}
