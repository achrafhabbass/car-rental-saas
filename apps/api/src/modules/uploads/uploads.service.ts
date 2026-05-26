import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

import type { AppConfig } from '../../config/configuration';

export type UploadKind =
  | 'vehicle'
  | 'inspection'
  | 'logo'
  | 'signature'
  | 'misc';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export interface UploadResult {
  url: string;
  publicId: string;
  bytes: number;
  format: string;
  width?: number;
  height?: number;
  resourceType: string;
}

/**
 * Single source of truth for binary uploads. Backed by Cloudinary.
 *
 * Other modules MUST go through `upload()` — never store raw URLs that
 * weren't issued by this service, otherwise we lose the per-tenant folder
 * structure and tag-based cleanup.
 *
 * When CLOUDINARY_CLOUD_NAME is unset the service stays "disabled" and
 * every upload call throws 503. This is deliberate: dev environments
 * without credentials should fail fast rather than silently store data
 * in someone else's account.
 */
@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private enabled = false;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const { cloudName, apiKey, apiSecret } = this.config.get('uploads', { infer: true });
    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary not configured — uploads disabled. Set CLOUDINARY_* env vars to enable.',
      );
      return;
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    this.enabled = true;
    this.logger.log(`Cloudinary configured (cloud=${cloudName})`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Upload an in-memory buffer to Cloudinary under a per-tenant folder.
   * Validates MIME type and size. Returns the secure URL and public id.
   */
  async upload(
    buffer: Buffer,
    mimeType: string,
    tenantId: string,
    kind: UploadKind = 'misc',
  ): Promise<UploadResult> {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'File storage is not configured on this server.',
      );
    }
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported file type "${mimeType}". Allowed: ${[...ALLOWED_MIME].join(', ')}`,
      );
    }

    const { maxBytes, folder } = this.config.get('uploads', { infer: true });
    if (buffer.byteLength > maxBytes) {
      throw new BadRequestException(
        `File too large (${buffer.byteLength} bytes). Max ${maxBytes} bytes.`,
      );
    }

    const fullFolder = `${folder}/${tenantId}/${kind}`;
    const resourceType: 'image' | 'raw' =
      mimeType === 'application/pdf' ? 'raw' : 'image';

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: fullFolder,
          resource_type: resourceType,
          tags: [`tenant:${tenantId}`, `kind:${kind}`],
        },
        (err, res) => {
          if (err || !res) reject(err ?? new Error('Empty upload response'));
          else resolve(res);
        },
      );
      stream.end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    };
  }

  /**
   * Delete a previously uploaded asset by its public id. Best-effort —
   * silently swallows "not found" so a missing remote object never
   * blocks an entity deletion.
   */
  async destroy(publicId: string, resourceType: string = 'image'): Promise<void> {
    if (!this.enabled) return;
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (err) {
      this.logger.warn(`Cloudinary destroy failed for ${publicId}: ${(err as Error).message}`);
    }
  }
}
