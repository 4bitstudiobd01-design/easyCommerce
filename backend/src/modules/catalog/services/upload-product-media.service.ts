import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { ProductEntity } from '../entities/product.entity';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

// Only raster formats a storefront can render. SVG is deliberately excluded: it can
// carry scripts, and these files are served from our own origin.
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export interface UploadedMediaResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class UploadProductMediaService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  private get uploadRoot(): string {
    return process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  }

  /**
   * Absolute base for returned URLs. The stored image URL has to be reachable from the
   * storefront and the dashboard, which run on a different origin than this API, so a
   * root-relative path would 404 there.
   */
  private get publicBaseUrl(): string {
    const configured = process.env.PUBLIC_API_URL || process.env.APP_URL;
    if (configured) return configured.replace(/\/+$/, '');
    return `http://localhost:${process.env.PORT || 5001}`;
  }

  /**
   * Persists uploaded image files and returns their public URLs.
   *
   * Files are written under uploads/products/<tenantId>/ so one merchant's media can
   * never overwrite another's, and the stored name is a generated UUID — the client
   * filename is never used on disk, which keeps path traversal ("../../etc/passwd")
   * and collisions impossible.
   *
   * When productId is supplied it is verified against the tenant first, so a caller
   * cannot attach media to another store's product.
   */
  async execute(
    tenantId: string,
    files: Express.Multer.File[],
    productId?: string,
  ): Promise<UploadedMediaResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No image files were provided.');
    }

    if (productId) {
      const product = await this.productRepository.findOne({ where: { id: productId, tenantId } });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Unsupported file type "${file.mimetype}". Allowed types: JPG, PNG, WEBP, GIF, AVIF.`,
        );
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new BadRequestException(
          `"${file.originalname}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed size is 5MB.`,
        );
      }
    }

    const tenantDir = join(this.uploadRoot, 'products', tenantId);
    await fs.mkdir(tenantDir, { recursive: true });

    const results: UploadedMediaResult[] = [];

    for (const file of files) {
      const extension = MIME_EXTENSIONS[file.mimetype] || extname(file.originalname).toLowerCase() || '.jpg';
      const fileName = `${randomUUID()}${extension}`;
      await fs.writeFile(join(tenantDir, fileName), file.buffer);

      results.push({
        url: `${this.publicBaseUrl}/uploads/products/${tenantId}/${fileName}`,
        fileName,
        size: file.size,
        mimeType: file.mimetype,
      });
    }

    return results;
  }
}
