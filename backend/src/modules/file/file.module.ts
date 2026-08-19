import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import { FileEntity } from './entities/file.entity';
import { FileService, STORAGE_DRIVER } from './file.service';
import { FileController } from './file.controller';
import { FileCleanupScheduler } from './file-cleanup.scheduler';
import { FileUploadGuard } from './guards/file-upload.guard';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import { S3StorageDriver } from './drivers/s3-storage.driver';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    MulterModule.register({
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|gif|avif|pdf|doc|docx|csv|svg)$/i)) {
          return cb(new Error('Unsupported file type!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    AuthModule,
  ],
  controllers: [FileController],
  providers: [
    FileService,
    FileCleanupScheduler,
    FileUploadGuard,
    LocalStorageDriver,
    S3StorageDriver,
    {
      provide: STORAGE_DRIVER,
      useFactory: (
        configService: ConfigService,
        local: LocalStorageDriver,
        s3: S3StorageDriver,
      ) => {
        const driver = configService.get<string>('STORAGE_DRIVER') || 'local';
        return driver.toLowerCase() === 's3' ? s3 : local;
      },
      inject: [ConfigService, LocalStorageDriver, S3StorageDriver],
    },
  ],
  exports: [FileService, TypeOrmModule, STORAGE_DRIVER],
})
export class FileModule {}
