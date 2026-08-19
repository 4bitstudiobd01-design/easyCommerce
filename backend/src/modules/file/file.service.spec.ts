import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FileService, STORAGE_DRIVER } from './file.service';
import { FileEntity, FileableType, FileType } from './entities/file.entity';
import { StorageDriver } from './interfaces/storage-driver.interface';

describe('FileService', () => {
  let service: FileService;
  let mockFileRepo: any;
  let mockStorageDriver: jest.Mocked<StorageDriver>;

  beforeEach(async () => {
    mockFileRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'file-123', ...dto })),
      save: jest.fn().mockImplementation((file) => Promise.resolve(file)),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    mockStorageDriver = {
      upload: jest.fn().mockResolvedValue({
        url: 'http://localhost:5001/uploads/tenant-1/products/sample.png',
        key: '/path/to/sample.png',
      }),
      uploadBuffer: jest.fn().mockResolvedValue({
        url: 'http://localhost:5001/uploads/tenant-1/products/sample.png',
        key: '/path/to/sample.png',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: getRepositoryToken(FileEntity),
          useValue: mockFileRepo,
        },
        {
          provide: STORAGE_DRIVER,
          useValue: mockStorageDriver,
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload single file and persist record in DB', async () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'logo.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('dummy image buffer'),
      size: 1024,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const result = await service.uploadSingle(
      mockFile,
      'store-1',
      FileableType.STORE_LOGO,
      FileType.IMAGE,
      'tenant-1',
    );

    expect(mockStorageDriver.upload).toHaveBeenCalled();
    expect(mockFileRepo.create).toHaveBeenCalled();
    expect(mockFileRepo.save).toHaveBeenCalled();
    expect(result.id).toBe('file-123');
    expect(result.url).toContain('sample.png');
  });

  it('should delete file and remove from storage', async () => {
    const existingFile = {
      id: 'file-123',
      path: '/path/to/sample.png',
      tenantId: 'tenant-1',
    };
    mockFileRepo.findOne.mockResolvedValue(existingFile);

    const result = await service.remove('file-123', 'tenant-1');

    expect(mockStorageDriver.delete).toHaveBeenCalledWith('/path/to/sample.png');
    expect(mockFileRepo.remove).toHaveBeenCalledWith(existingFile);
    expect(result.message).toBe('File deleted successfully');
  });
});
