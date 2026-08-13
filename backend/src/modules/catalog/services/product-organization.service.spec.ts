import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UpdateCategoryService } from './update-category.service';
import { DeleteCategoryService } from './delete-category.service';
import { CreateBrandService } from './create-brand.service';
import { DeleteBrandService } from './delete-brand.service';
import { CreateCollectionService } from './create-collection.service';
import { DeleteCollectionService } from './delete-collection.service';
import { ProductSlugService } from './product-slug.service';

import { CategoryEntity } from '../entities/category.entity';
import { BrandEntity } from '../entities/brand.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { ProductEntity } from '../entities/product.entity';

describe('Product Organization Services', () => {
  let updateCategoryService: UpdateCategoryService;
  let deleteCategoryService: DeleteCategoryService;
  let createBrandService: CreateBrandService;
  let deleteBrandService: DeleteBrandService;
  let createCollectionService: CreateCollectionService;
  let deleteCollectionService: DeleteCollectionService;

  let categoryRepo: any;
  let brandRepo: any;
  let collectionRepo: any;
  let productRepo: any;
  let slugService: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    categoryRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
      update: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(true),
    };

    brandRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((b) => ({ id: 'brand-1', ...b })),
      save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
      remove: jest.fn().mockResolvedValue(true),
    };

    collectionRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((c) => ({ id: 'col-1', ...c })),
      save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
      remove: jest.fn().mockResolvedValue(true),
    };

    productRepo = {
      update: jest.fn().mockResolvedValue(true),
    };

    slugService = {
      generateSlug: jest.fn().mockImplementation((val) => Promise.resolve(val.toLowerCase().replace(/\s+/g, '-'))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCategoryService,
        DeleteCategoryService,
        CreateBrandService,
        DeleteBrandService,
        CreateCollectionService,
        DeleteCollectionService,
        { provide: getRepositoryToken(CategoryEntity), useValue: categoryRepo },
        { provide: getRepositoryToken(BrandEntity), useValue: brandRepo },
        { provide: getRepositoryToken(CollectionEntity), useValue: collectionRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: ProductSlugService, useValue: slugService },
      ],
    }).compile();

    updateCategoryService = module.get<UpdateCategoryService>(UpdateCategoryService);
    deleteCategoryService = module.get<DeleteCategoryService>(DeleteCategoryService);
    createBrandService = module.get<CreateBrandService>(CreateBrandService);
    deleteBrandService = module.get<DeleteBrandService>(DeleteBrandService);
    createCollectionService = module.get<CreateCollectionService>(CreateCollectionService);
    deleteCollectionService = module.get<DeleteCollectionService>(DeleteCollectionService);
  });

  describe('UpdateCategoryService - Circular Reference Protection', () => {
    it('should throw BadRequestException if setting category parent to itself', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 'cat-1', tenantId: mockTenantId });

      await expect(
        updateCategoryService.execute('cat-1', mockTenantId, { parentId: 'cat-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new parent is a descendant (circular hierarchy)', async () => {
      // cat-1 -> parent of cat-2 -> parent of cat-3
      // Attempting to set parent of cat-1 to cat-3
      categoryRepo.findOne.mockImplementation(({ where }) => {
        if (where.id === 'cat-1') return Promise.resolve({ id: 'cat-1', tenantId: mockTenantId });
        if (where.id === 'cat-3') return Promise.resolve({ id: 'cat-3', parentId: 'cat-2', tenantId: mockTenantId });
        if (where.id === 'cat-2') return Promise.resolve({ id: 'cat-2', parentId: 'cat-1', tenantId: mockTenantId });
        return Promise.resolve(null);
      });

      await expect(
        updateCategoryService.execute('cat-1', mockTenantId, { parentId: 'cat-3' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Brand Services & Deletion Safety', () => {
    it('should create brand with slug and tenant isolation', async () => {
      const result = await createBrandService.execute(mockTenantId, { name: 'Samsung' });

      expect(result.name).toBe('Samsung');
      expect(result.slug).toBe('samsung');
      expect(result.tenantId).toBe(mockTenantId);
    });

    it('should reset product brandId to null when brand is deleted (do not delete products)', async () => {
      brandRepo.findOne.mockResolvedValue({ id: 'brand-1', name: 'Samsung', tenantId: mockTenantId });

      await deleteBrandService.execute('brand-1', mockTenantId);

      expect(productRepo.update).toHaveBeenCalledWith(
        { brandId: 'brand-1', tenantId: mockTenantId },
        { brandId: undefined },
      );
      expect(brandRepo.remove).toHaveBeenCalled();
    });
  });

  describe('Collection Services & Deletion Safety', () => {
    it('should create collection with tenant isolation', async () => {
      const result = await createCollectionService.execute(mockTenantId, { name: 'Summer Outfits' });

      expect(result.name).toBe('Summer Outfits');
      expect(result.slug).toBe('summer-outfits');
      expect(result.tenantId).toBe(mockTenantId);
    });

    it('should safely remove collection without deleting products', async () => {
      collectionRepo.findOne.mockResolvedValue({ id: 'col-1', name: 'Summer Outfits', tenantId: mockTenantId });

      await deleteCollectionService.execute('col-1', mockTenantId);

      expect(collectionRepo.remove).toHaveBeenCalled();
    });
  });
});
