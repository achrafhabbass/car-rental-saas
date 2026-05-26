export type UploadKind =
  | 'vehicle'
  | 'inspection'
  | 'logo'
  | 'signature'
  | 'misc';

export interface UploadResponseDto {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
  resourceType: string;
}
