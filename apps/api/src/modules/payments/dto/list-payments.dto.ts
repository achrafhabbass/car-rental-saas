import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListPaymentsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}
