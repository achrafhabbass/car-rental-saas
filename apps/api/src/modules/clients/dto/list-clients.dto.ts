import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ClientSegment, ClientType } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ToBoolean } from '../../../common/transformers/boolean.transformer';

export class ListClientsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsEnum(ClientSegment)
  segment?: ClientSegment;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  blacklisted?: boolean;
}
