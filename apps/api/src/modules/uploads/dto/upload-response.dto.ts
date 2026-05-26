import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: 'Secure HTTPS URL of the uploaded asset' })
  url!: string;

  @ApiProperty({ description: 'Cloudinary public id (use to delete later)' })
  publicId!: string;

  @ApiProperty({ description: 'Size in bytes' })
  bytes!: number;

  @ApiProperty({ description: 'File format (jpg, png, pdf, ...)' })
  format!: string;

  @ApiProperty({ required: false })
  width?: number;

  @ApiProperty({ required: false })
  height?: number;

  @ApiProperty({ description: 'image | raw | video' })
  resourceType!: string;
}
