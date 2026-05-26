import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Express } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadKind, UploadsService } from './uploads.service';

const VALID_KINDS: UploadKind[] = [
  'vehicle',
  'inspection',
  'logo',
  'signature',
  'misc',
];

@ApiTags('Uploads')
@ApiBearerAuth('JWT')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file (image or PDF) to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiQuery({
    name: 'kind',
    required: false,
    enum: VALID_KINDS,
    description: 'Logical category — controls the folder layout in storage.',
  })
  async upload(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('kind') kind?: string,
  ): Promise<UploadResponseDto> {
    if (!file) throw new BadRequestException('No file provided');

    const resolvedKind: UploadKind =
      kind && VALID_KINDS.includes(kind as UploadKind)
        ? (kind as UploadKind)
        : 'misc';

    return this.uploads.upload(
      file.buffer,
      file.mimetype,
      tenantId,
      resolvedKind,
    );
  }
}
