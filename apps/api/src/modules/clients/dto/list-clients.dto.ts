import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ClientSegment, ClientType } from '@prisma/client';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ListClientsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  @IsOptional()
  @IsEnum(ClientSegment)
  segment?: ClientSegment;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  blacklisted?: boolean;
}
