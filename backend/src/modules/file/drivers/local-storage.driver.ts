import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { StorageDriver } from '../interfaces/storage-driver.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly logger = new Logger(LocalStorageDriver.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DIR') ||
      path.join(process.cwd(), 'uploads');

    const configured =
      this.configService.get<string>('PUBLIC_API_URL') ||
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('BASE_URL');

    if (configured) {
      this.baseUrl = configured.replace(/\/+$/, '');
    } else {
      const port = this.configService.get<string>('PORT') || '5001';
      this.baseUrl = `http://localhost:${port}`;
    }

    // Ensure base upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    folder: string = '',
    tenantId: string = 'common',
  ): Promise<{ url: string; key: string }> {
    const ext =
      path.extname(file.originalname).toLowerCase() ||
      (file.mimetype.includes('png')
        ? '.png'
        : file.mimetype.includes('webp')
          ? '.webp'
          : '.jpg');

    const fileName = `${randomUUID()}${ext}`;

    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      buffer = fs.readFileSync(file.path);
    } else {
      throw new Error('No file content available for upload');
    }

    return this.uploadBuffer(buffer, fileName, file.mimetype, folder, tenantId);
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimetype: string,
    folder: string = '',
    tenantId: string = 'common',
  ): Promise<{ url: string; key: string }> {
    // Relative storage subfolder e.g. uploads/tenant-123/products/abc.png
    const targetSubfolder = folder
      ? path.join(tenantId, folder)
      : tenantId;

    const fullDirPath = path.join(this.uploadDir, targetSubfolder);

    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
    }

    const fullFilePath = path.join(fullDirPath, fileName);
    fs.writeFileSync(fullFilePath, buffer);

    // Standardized URL path
    const relativePosixPath = path.posix.join('uploads', targetSubfolder.replace(/\\/g, '/'), fileName);
    const url = `${this.baseUrl}/${relativePosixPath}`;

    return {
      url,
      key: fullFilePath, // Absolute path used as key for deletion
    };
  }

  async delete(key: string): Promise<void> {
    try {
      if (fs.existsSync(key)) {
        fs.unlinkSync(key);
        this.logger.log(`Deleted local file: ${key}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to delete local file at ${key}: ${error.message}`,
      );
    }
  }
}
