import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FileEntity,
  FileableType,
  FileType,
} from './entities/file.entity';
import type { StorageDriver } from './interfaces/storage-driver.interface';
import sharp from 'sharp';

export const STORAGE_DRIVER = 'STORAGE_DRIVER';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    @Inject(STORAGE_DRIVER)
    private readonly storageDriver: StorageDriver,
  ) {}

  /**
   * Processes an image file with sharp for compression, rotation, and optimization.
   */
  private async processImage(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    if (!file.mimetype.startsWith('image/') || file.mimetype.includes('svg')) {
      return file;
    }

    try {
      this.logger.log(
        `Optimizing image: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`,
      );
      let sharpFn: any;
      try {
        const mod = require('sharp');
        sharpFn = typeof mod === 'function' ? mod : mod?.default;
      } catch {
        return file;
      }

      if (typeof sharpFn !== 'function') {
        return file;
      }

      const sharpInstance = sharpFn(file.buffer);
      const metadata = await sharpInstance.metadata();

      let pipeline = sharpInstance
        .resize({
          width: 1920,
          withoutEnlargement: true,
          fit: 'inside',
        })
        .rotate(); // Auto-rotate based on EXIF orientation

      if (metadata.format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: 80, progressive: true });
      } else if (metadata.format === 'png') {
        pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
      } else if (metadata.format === 'webp') {
        pipeline = pipeline.webp({ quality: 80 });
      }

      const compressedBuffer = await pipeline.toBuffer();

      this.logger.log(
        `Image optimized: ${file.originalname}. New size: ${(compressedBuffer.length / 1024).toFixed(2)} KB`,
      );

      file.buffer = compressedBuffer;
      file.size = compressedBuffer.length;

      return file;
    } catch (error: any) {
      this.logger.error(
        `Failed to process image ${file.originalname}: ${error.message}`,
      );
      return file;
    }
  }

  // =========================
  // Upload Single File
  // =========================
  async uploadSingle(
    file: Express.Multer.File,
    fileableId?: string,
    fileableType: FileableType = FileableType.GENERAL,
    fileType: FileType = FileType.IMAGE,
    tenantId: string = 'common',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }

    const processedFile = await this.processImage(file);

    const { url, key } = await this.storageDriver.upload(
      processedFile,
      fileableType.toLowerCase(),
      tenantId,
    );

    const fileRecord = this.fileRepo.create({
      fileName: file.originalname,
      url,
      path: key,
      mimeType: file.mimetype,
      sizeInBytes: file.size,
      fileableId: fileableId || null,
      fileableType,
      fileType,
      tenantId,
    });

    await this.fileRepo.save(fileRecord);

    return {
      id: fileRecord.id,
      url: fileRecord.url,
      fileName: fileRecord.fileName,
      mimeType: fileRecord.mimeType,
      sizeInBytes: fileRecord.sizeInBytes,
      fileableType: fileRecord.fileableType,
      fileType: fileRecord.fileType,
    };
  }

  // =========================
  // Upload Multiple Files
  // =========================
  async uploadMultiple(
    files: Express.Multer.File[],
    fileableId?: string,
    fileableType: FileableType = FileableType.GENERAL,
    fileType: FileType = FileType.IMAGE,
    tenantId: string = 'common',
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload.');
    }

    const results: any[] = [];

    for (const file of files) {
      const processedFile = await this.processImage(file);

      const { url, key } = await this.storageDriver.upload(
        processedFile,
        fileableType.toLowerCase(),
        tenantId,
      );

      const fileRecord = this.fileRepo.create({
        fileName: file.originalname,
        url,
        path: key,
        mimeType: file.mimetype,
        sizeInBytes: file.size,
        fileableId: fileableId || null,
        fileableType,
        fileType,
        tenantId,
      });

      await this.fileRepo.save(fileRecord);

      results.push({
        id: fileRecord.id,
        url: fileRecord.url,
        fileName: fileRecord.fileName,
        mimeType: fileRecord.mimeType,
        sizeInBytes: fileRecord.sizeInBytes,
        fileableType: fileRecord.fileableType,
        fileType: fileRecord.fileType,
      });
    }

    return results;
  }

  // =========================
  // Delete File
  // =========================
  async remove(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const fileRecord = await this.fileRepo.findOne({ where });

    if (!fileRecord) {
      throw new NotFoundException('File record not found in database.');
    }

    if (fileRecord.path) {
      await this.storageDriver.delete(fileRecord.path);
    }

    await this.fileRepo.remove(fileRecord);

    return { message: 'File deleted successfully', id };
  }

  async findAll(tenantId?: string) {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return this.fileRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    const file = await this.fileRepo.findOne({ where });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async findByFileable(fileableType: FileableType, fileableId: string, tenantId?: string) {
    const where: any = { fileableType, fileableId };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    return this.fileRepo.find({ where, order: { createdAt: 'DESC' } });
  }
}
