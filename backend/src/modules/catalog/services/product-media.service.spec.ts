import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { AddProductMediaService } from './add-product-media.service';
import { SetPrimaryProductMediaService } from './set-primary-product-media.service';
import { ReorderProductMediaService } from './reorder-product-media.service';
import { DeleteProductMediaService } from './delete-product-media.service';
import { ListProductMediaService } from './list-product-media.service';

import { ProductEntity } from '../entities/product.entity';
import { ProductImageEntity } from '../entities/product-image.entity';

describe('Product Media Services', () => {
  let addService: AddProductMediaService;
  let setPrimaryService: SetPrimaryProductMediaService;
  let reorderService: ReorderProductMediaService;
  let deleteService: DeleteProductMediaService;
  let listService: ListProductMediaService;

  let productRepo: any;
  let imageRepo: any;

  const mockTenantId = 'tenant-uuid-1';
  const mockProductId = 'prod-100';

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === mockProductId && where.tenantId === mockTenantId) {
          return Promise.resolve({ id: mockProductId, name: 'Sample Product', tenantId: mockTenantId });
        }
        return Promise.resolve(null);
      }),
    };

    imageRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'img-new', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      update: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddProductMediaService,
        SetPrimaryProductMediaService,
        ReorderProductMediaService,
        DeleteProductMediaService,
        ListProductMediaService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken(ProductImageEntity),
          useValue: imageRepo,
        },
      ],
    }).compile();

    addService = module.get<AddProductMediaService>(AddProductMediaService);
    setPrimaryService = module.get<SetPrimaryProductMediaService>(SetPrimaryProductMediaService);
    reorderService = module.get<ReorderProductMediaService>(ReorderProductMediaService);
    deleteService = module.get<DeleteProductMediaService>(DeleteProductMediaService);
    listService = module.get<ListProductMediaService>(ListProductMediaService);
  });

  describe('AddProductMediaService', () => {
    it('should automatically set first image as primary', async () => {
      imageRepo.find.mockResolvedValue([]);

      const result = await addService.execute(mockProductId, mockTenantId, {
        url: 'https://example.com/image1.jpg',
      });

      expect(imageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/image1.jpg',
          isPrimary: true,
          sortOrder: 0,
        }),
      );
      expect(result.isPrimary).toBe(true);
    });

    it('should set isPrimary to false for subsequent images by default', async () => {
      imageRepo.find.mockResolvedValue([
        { id: 'img-1', isPrimary: true, sortOrder: 0 },
      ]);

      const result = await addService.execute(mockProductId, mockTenantId, {
        url: 'https://example.com/image2.jpg',
      });

      expect(imageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/image2.jpg',
          isPrimary: false,
          sortOrder: 1,
        }),
      );
      expect(result.isPrimary).toBe(false);
    });

    it('should throw NotFoundException if product belongs to another tenant', async () => {
      await expect(
        addService.execute('other-prod', mockTenantId, { url: 'https://example.com/image.jpg' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('SetPrimaryProductMediaService', () => {
    it('should unset siblings primary state and set target image as primary', async () => {
      const mockImage = { id: 'img-2', productId: mockProductId, tenantId: mockTenantId, isPrimary: false };
      imageRepo.findOne.mockResolvedValue(mockImage);

      const result = await setPrimaryService.execute(mockProductId, 'img-2', mockTenantId);

      expect(imageRepo.update).toHaveBeenCalledWith(
        { productId: mockProductId, tenantId: mockTenantId },
        { isPrimary: false },
      );
      expect(result.isPrimary).toBe(true);
    });

    it('should throw NotFoundException if media does not belong to product/tenant', async () => {
      imageRepo.findOne.mockResolvedValue(null);

      await expect(
        setPrimaryService.execute(mockProductId, 'invalid-img', mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('ReorderProductMediaService', () => {
    it('should reorder images sequentially', async () => {
      const mockImages = [
        { id: 'img-1', sortOrder: 0, productId: mockProductId, tenantId: mockTenantId },
        { id: 'img-2', sortOrder: 1, productId: mockProductId, tenantId: mockTenantId },
      ];
      imageRepo.find.mockResolvedValue(mockImages);

      await reorderService.execute(mockProductId, mockTenantId, {
        mediaIds: ['img-2', 'img-1'],
      });

      expect(imageRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if a media ID does not belong to product', async () => {
      imageRepo.find.mockResolvedValue([
        { id: 'img-1', productId: mockProductId, tenantId: mockTenantId },
      ]);

      await expect(
        reorderService.execute(mockProductId, mockTenantId, { mediaIds: ['img-1', 'other-img'] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DeleteProductMediaService', () => {
    it('should delete image and promote next image if primary image was deleted', async () => {
      const primaryImage = { id: 'img-1', isPrimary: true, productId: mockProductId, tenantId: mockTenantId };
      const nextImage = { id: 'img-2', isPrimary: false, sortOrder: 1, productId: mockProductId, tenantId: mockTenantId };

      imageRepo.findOne.mockResolvedValue(primaryImage);
      imageRepo.find.mockResolvedValue([nextImage]);

      await deleteService.execute(mockProductId, 'img-1', mockTenantId);

      expect(imageRepo.remove).toHaveBeenCalledWith(primaryImage);
      expect(imageRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'img-2', isPrimary: true }));
    });
  });
});
