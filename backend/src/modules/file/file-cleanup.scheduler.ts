import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FileEntity, FileableType } from './entities/file.entity';
import { STORAGE_DRIVER } from './file.service';
import type { StorageDriver } from './interfaces/storage-driver.interface';

const FILEABLE_TABLE_MAP: Partial<Record<FileableType, string>> = {
  [FileableType.PRODUCT]: 'products',
  [FileableType.CATEGORY]: 'categories',
  [FileableType.BLOG_POST]: 'blog_posts',
  [FileableType.USER_AVATAR]: 'users',
};

@Injectable()
export class FileCleanupScheduler {
  private readonly logger = new Logger(FileCleanupScheduler.name);

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    private readonly dataSource: DataSource,
    @Inject(STORAGE_DRIVER)
    private readonly storageDriver: StorageDriver,
  ) {}

  @Cron('0 0 2 * * *') // Daily at 2:00 AM
  async handleOrphanedFileCleanup() {
    this.logger.log('Starting automated orphaned file cleanup...');

    try {
      const allFiles = await this.fileRepo.find();
      this.logger.log(`Total file records to inspect: ${allFiles.length}`);

      const orphaned: FileEntity[] = [];

      for (const file of allFiles) {
        if (!file.fileableId) continue;

        const table = FILEABLE_TABLE_MAP[file.fileableType];
        if (!table) continue;

        try {
          const result = await this.dataSource.query(
            `SELECT 1 FROM "${table}" WHERE id = $1 LIMIT 1`,
            [file.fileableId],
          );

          if (result.length === 0) {
            orphaned.push(file);
          }
        } catch (err: any) {
          // Table might not exist or schema difference
          this.logger.warn(`Could not verify table "${table}": ${err.message}`);
        }
      }

      this.logger.log(`Orphaned files found: ${orphaned.length}`);

      let deletedFromStorage = 0;
      let deletedFromDb = 0;

      for (const file of orphaned) {
        if (file.path) {
          try {
            await this.storageDriver.delete(file.path);
            deletedFromStorage++;
          } catch (err: any) {
            this.logger.warn(
              `Failed to delete from storage: ${file.path} — ${err.message}`,
            );
          }
        }

        await this.fileRepo.remove(file);
        deletedFromDb++;
      }

      this.logger.log(
        `Orphaned file cleanup completed: ${deletedFromStorage} removed from storage, ${deletedFromDb} DB records cleaned.`,
      );
    } catch (err: any) {
      this.logger.error(`Error during file cleanup job: ${err.message}`);
    }
  }
}
