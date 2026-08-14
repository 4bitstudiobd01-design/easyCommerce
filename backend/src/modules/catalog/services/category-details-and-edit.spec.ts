import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CategoryEntity } from '../entities/category.entity';
import { FindCategoryByIdService } from './find-category-by-id.service';
import { UpdateCategoryService } from './update-category.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('Category Details & Edit (Chunk 4)', () => {
  let findService: FindCategoryByIdService;
  let updateService: UpdateCategoryService;
  let categoryRepo: any;

  const tenantA = 'tenant-store-a';
  const tenantB = 'tenant-store-b';

  let mockCategoriesStore: any[] = [];

  beforeEach(async () => {
    mockCategoriesStore = [
      {
        id: 'cat-root-1',
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        description: 'All fashion items',
        parentId: null,
        status: CategoryStatus.ACTIVE,
        sortOrder: 1,
        tenantId: tenantA,
        createdAt: new Date('2026-08-01T00:00:00Z'),
        updatedAt: new Date('2026-08-01T00:00:00Z'),
        subcategories: [],
      },
      {
        id: 'cat-child-1',
        name: "Men's Wear",
        slug: 'mens-wear',
        description: 'Men clothing',
        parentId: 'cat-root-1',
        status: CategoryStatus.ACTIVE,
        sortOrder: 2,
        tenantId: tenantA,
        createdAt: new Date('2026-08-02T00:00:00Z'),
        updatedAt: new Date('2026-08-02T00:00:00Z'),
        subcategories: [],
      },
      {
        id: 'cat-grandchild-1',
        name: 'Formal Shirts',
        slug: 'formal-shirts',
        description: 'Men formal shirts',
        parentId: 'cat-child-1',
        status: CategoryStatus.ACTIVE,
        sortOrder: 3,
        tenantId: tenantA,
        createdAt: new Date('2026-08-03T00:00:00Z'),
        updatedAt: new Date('2026-08-03T00:00:00Z'),
        subcategories: [],
      },
      {
        id: 'cat-store-b',
        name: 'Store B Exclusive Category',
        slug: 'store-b-exclusive',
        description: 'Store B items',
        parentId: null,
        status: CategoryStatus.ACTIVE,
        sortOrder: 1,
        tenantId: tenantB,
        createdAt: new Date('2026-08-04T00:00:00Z'),
        updatedAt: new Date('2026-08-04T00:00:00Z'),
        subcategories: [],
      },
    ];

    categoryRepo = {
      findOne: jest.fn().mockImplementation(async ({ where, relations }) => {
        const found = mockCategoriesStore.find((c) => {
          return Object.entries(where).every(([k, v]) => (c as any)[k] === v);
        });

        if (!found) return null;

        const copy = { ...found };
        if (relations?.includes('subcategories')) {
          copy.subcategories = mockCategoriesStore.filter(
            (c) => c.parentId === found.id && c.tenantId === found.tenantId,
          );
        }
        if (relations?.includes('parentCategory') && found.parentId) {
          copy.parentCategory = mockCategoriesStore.find(
            (c) => c.id === found.parentId && c.tenantId === found.tenantId,
          );
        }

        return copy;
      }),
      save: jest.fn().mockImplementation(async (entity) => {
        const idx = mockCategoriesStore.findIndex((c) => c.id === entity.id);
        if (idx >= 0) {
          mockCategoriesStore[idx] = { ...mockCategoriesStore[idx], ...entity };
          return mockCategoriesStore[idx];
        }
        mockCategoriesStore.push(entity);
        return entity;
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ productsCount: 15, subcategoriesCount: 1 }),
      })),
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindCategoryByIdService,
        UpdateCategoryService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepo,
        },
      ],
    }).compile();

    findService = module.get<FindCategoryByIdService>(FindCategoryByIdService);
    updateService = module.get<UpdateCategoryService>(UpdateCategoryService);
  });

  describe('1. Find Category Details by ID', () => {
    it('should retrieve a category with parent relation and product counts for own tenant', async () => {
      const result = await findService.execute('cat-child-1', tenantA);

      expect(result).toBeDefined();
      expect(result.id).toBe('cat-child-1');
      expect(result.name).toBe("Men's Wear");
      expect(result.parentCategory).toBeDefined();
      expect(result.parentCategory?.id).toBe('cat-root-1');
      expect((result as any).productsCount).toBe(15);
    });

    it('should reject requests for a category belonging to another tenant (404 / Tenant Isolation)', async () => {
      await expect(findService.execute('cat-store-b', tenantA)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-existent category ID', async () => {
      await expect(findService.execute('non-existent-uuid', tenantA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('2. Update Category Details', () => {
    it('should update category name, description, and status successfully', async () => {
      const updated = await updateService.execute('cat-root-1', tenantA, {
        name: 'Fashion & Luxury Apparel',
        description: 'Updated luxury description',
        status: CategoryStatus.DRAFT,
      });

      expect(updated.name).toBe('Fashion & Luxury Apparel');
      expect(updated.description).toBe('Updated luxury description');
      expect(updated.status).toBe(CategoryStatus.DRAFT);
    });

    it('should allow updating slug to a new unique slug in the same store', async () => {
      const updated = await updateService.execute('cat-root-1', tenantA, {
        slug: 'fashion-luxury',
      });

      expect(updated.slug).toBe('fashion-luxury');
    });

    it('should reject updating slug if it conflicts with another category in the same store', async () => {
      await expect(
        updateService.execute('cat-root-1', tenantA, {
          slug: 'mens-wear', // already used by cat-child-1
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating category with its own existing slug', async () => {
      const updated = await updateService.execute('cat-root-1', tenantA, {
        name: 'Fashion & Apparel Renamed',
        slug: 'fashion-apparel', // same slug
      });

      expect(updated.name).toBe('Fashion & Apparel Renamed');
      expect(updated.slug).toBe('fashion-apparel');
    });

    it('should reject updating a category belonging to another tenant', async () => {
      await expect(
        updateService.execute('cat-store-b', tenantA, {
          name: 'Hijacked Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Hierarchy Safety & Circular Dependency Prevention', () => {
    it('should reject setting a category as its own parent', async () => {
      await expect(
        updateService.execute('cat-root-1', tenantA, {
          parentId: 'cat-root-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject setting a cross-tenant category as parent', async () => {
      await expect(
        updateService.execute('cat-root-1', tenantA, {
          parentId: 'cat-store-b',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should detect and reject circular hierarchy (setting ancestor parent to descendant)', async () => {
      // Hierarchy is: cat-root-1 -> cat-child-1 -> cat-grandchild-1
      // Attempting to set cat-root-1's parent to cat-grandchild-1 should be rejected!
      await expect(
        updateService.execute('cat-root-1', tenantA, {
          parentId: 'cat-grandchild-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow moving category to root (unlinking parent)', async () => {
      const updated = await updateService.execute('cat-child-1', tenantA, {
        parentId: '',
      });

      expect(updated.parentId).toBeUndefined();
    });
  });
});
