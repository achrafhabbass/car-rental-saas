import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ContractStatus } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListContractsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
