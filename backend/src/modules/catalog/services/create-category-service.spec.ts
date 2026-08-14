import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryEntity } from '../entities/category.entity';
import { CreateCategoryService } from './create-category.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('CreateCategoryService (Chunk 3)', () => {
  let service: CreateCategoryService;
  let categoryRepo: any;

  const tenantA = 'tenant-store-a';
  const tenantB = 'tenant-store-b';

  let mockCategories: CategoryEntity[] = [];

  beforeEach(async () => {
    mockCategories = [];

    categoryRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (entity) => {
        mockCategories.push(entity);
        return entity;
      }),
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        return mockCategories.find((c) => {
          return Object.entries(where).every(([k, v]) => (c as any)[k] === v);
        }) || null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepo,
        },
      ],
    }).compile();

    service = module.get<CreateCategoryService>(CreateCategoryService);
  });

  describe('1. Root Category Creation', () => {
    it('should create a root category with auto-generated slug and default active status', async () => {
      const created = await service.execute(tenantA, {
        name: "Men's Fashion & Accessories",
      });

      expect(created).toBeDefined();
      expect(created.name).toBe("Men's Fashion & Accessories");
      expect(created.slug).toBe('mens-fashion-accessories');
      expect(created.tenantId).toBe(tenantA);
      expect(created.status).toBe(CategoryStatus.ACTIVE);
      expect(created.parentId).toBeUndefined();
    });

    it('should create category with custom slug if provided', async () => {
      const created = await service.execute(tenantA, {
        name: 'Footwear Collection',
        slug: 'custom-shoes',
      });

      expect(created.slug).toBe('custom-shoes');
    });

    it('should respect specified category status (e.g. DRAFT)', async () => {
      const created = await service.execute(tenantA, {
        name: 'Winter Sale Draft',
        status: CategoryStatus.DRAFT,
      });

      expect(created.status).toBe(CategoryStatus.DRAFT);
    });
  });

  describe('2. Subcategory & Parent Validation', () => {
    it('should create a child category when parent belongs to same tenant', async () => {
      const parent = await service.execute(tenantA, {
        name: 'Electronics',
      });

      const child = await service.execute(tenantA, {
        name: 'Smartphones',
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);
      expect(child.tenantId).toBe(tenantA);
    });

    it('should reject parent category if it does not exist', async () => {
      await expect(
        service.execute(tenantA, {
          name: 'Orphan Child',
          parentId: 'non-existent-uuid',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject parent category belonging to a different tenant', async () => {
      const storeBParent = await service.execute(tenantB, {
        name: 'Store B Root',
      });

      await expect(
        service.execute(tenantA, {
          name: 'Store A Sneaky Child',
          parentId: storeBParent.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Slug Uniqueness & Tenant Isolation', () => {
    it('should reject duplicate slug within the same store', async () => {
      await service.execute(tenantA, {
        name: 'Apparel',
        slug: 'apparel',
      });

      await expect(
        service.execute(tenantA, {
          name: 'Apparel duplicate',
          slug: 'apparel',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow identical slug in different stores', async () => {
      const catA = await service.execute(tenantA, {
        name: 'Apparel',
        slug: 'apparel',
      });

      const catB = await service.execute(tenantB, {
        name: 'Apparel',
        slug: 'apparel',
      });

      expect(catA.slug).toBe('apparel');
      expect(catB.slug).toBe('apparel');
      expect(catA.tenantId).toBe(tenantA);
      expect(catB.tenantId).toBe(tenantB);
    });
  });
});
