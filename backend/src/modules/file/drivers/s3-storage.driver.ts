import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { StorageDriver } from '../interfaces/storage-driver.interface';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class S3StorageDriver implements StorageDriver {
  private readonly logger = new Logger(S3StorageDriver.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cdnUrl: string;
  private readonly rootPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.region = (
      this.configService.get<string>('AWS_DEFAULT_REGION') ||
      this.configService.get<string>('AWS_REGION') ||
      'us-east-1'
    ).trim();

    this.bucket = (
      this.configService.get<string>('AWS_BUCKET') ||
      this.configService.get<string>('AWS_S3_BUCKET') ||
      ''
    ).trim();

    this.cdnUrl = (this.configService.get<string>('AWS_URL') || '').trim();

    this.rootPrefix = (this.configService.get<string>('AWS_ROOT_PREFIX') || '')
      .trim()
      .replace(/^\/+|\/+$/g, '');

    const endpoint = (
      this.configService.get<string>('AWS_ENDPOINT') || ''
    ).trim();

    const forcePathStyle =
      this.configService.get<string>('AWS_USE_PATH_STYLE_ENDPOINT') === 'true';

    const accessKeyId = (
      this.configService.get<string>('AWS_ACCESS_KEY_ID') || ''
    ).trim();

    const secretAccessKey = (
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || ''
    ).trim();

    this.logger.log(
      `Initializing S3 Storage: Bucket=${this.bucket || '(unset)'}, Region=${this.region}, Endpoint=${endpoint || 'AWS S3 Default'}`,
    );

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: endpoint || undefined,
      forcePathStyle: forcePathStyle,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey,
      } : undefined,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
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

    let body: Buffer;
    if (file.buffer) {
      body = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      body = fs.readFileSync(file.path);
    } else {
      throw new Error('No file content available for upload');
    }

    return this.uploadBuffer(body, fileName, file.mimetype, folder, tenantId);
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimetype: string,
    folder: string = '',
    tenantId: string = 'common',
  ): Promise<{ url: string; key: string }> {
    let subpath = folder ? `${tenantId}/${folder}/${fileName}` : `${tenantId}/${fileName}`;
    let key = this.rootPrefix ? `${this.rootPrefix}/${subpath}` : subpath;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await this.s3Client.send(command);

    const url = this.cdnUrl
      ? `${this.cdnUrl.replace(/\/$/, '')}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      url,
      key,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted S3 object with key: ${key}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to delete S3 object with key ${key}: ${error.message}`,
      );
    }
  }
}
