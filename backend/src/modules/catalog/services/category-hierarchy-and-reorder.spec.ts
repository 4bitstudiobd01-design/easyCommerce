import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoryEntity } from '../entities/category.entity';
import { GetCategoryTreeService } from './get-category-tree.service';
import { ReorderCategoryService } from './reorder-category.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('Category Hierarchy + Tree + Reorder (Chunk 5)', () => {
  let treeService: GetCategoryTreeService;
  let reorderService: ReorderCategoryService;
  let categoryRepo: any;
  let dataSource: any;

  const tenantA = 'tenant-store-a';
  const tenantB = 'tenant-store-b';

  let mockCategories: any[] = [];

  beforeEach(async () => {
    mockCategories = [
      {
        id: 'cat-fashion',
        name: 'Fashion',
        slug: 'fashion',
        parentId: null,
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        tenantId: tenantA,
        createdAt: new Date('2026-08-01T00:00:00Z'),
        updatedAt: new Date('2026-08-01T00:00:00Z'),
        productsCount: 124,
      },
      {
        id: 'cat-mens',
        name: "Men's Fashion",
        slug: 'mens-fashion',
        parentId: 'cat-fashion',
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        tenantId: tenantA,
        createdAt: new Date('2026-08-02T00:00:00Z'),
        updatedAt: new Date('2026-08-02T00:00:00Z'),
        productsCount: 48,
      },
      {
        id: 'cat-womens',
        name: "Women's Fashion",
        slug: 'womens-fashion',
        parentId: 'cat-fashion',
        status: CategoryStatus.ACTIVE,
        sortOrder: 1,
        tenantId: tenantA,
        createdAt: new Date('2026-08-03T00:00:00Z'),
        updatedAt: new Date('2026-08-03T00:00:00Z'),
        productsCount: 52,
      },
      {
        id: 'cat-shirts',
        name: 'Shirts',
        slug: 'shirts',
        parentId: 'cat-mens',
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        tenantId: tenantA,
        createdAt: new Date('2026-08-04T00:00:00Z'),
        updatedAt: new Date('2026-08-04T00:00:00Z'),
        productsCount: 20,
      },
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        parentId: null,
        status: CategoryStatus.ACTIVE,
        sortOrder: 1,
        tenantId: tenantA,
        createdAt: new Date('2026-08-05T00:00:00Z'),
        updatedAt: new Date('2026-08-05T00:00:00Z'),
        productsCount: 86,
      },
      {
        id: 'cat-store-b',
        name: 'Store B Category',
        slug: 'store-b-cat',
        parentId: null,
        status: CategoryStatus.ACTIVE,
        sortOrder: 0,
        tenantId: tenantB,
        createdAt: new Date('2026-08-06T00:00:00Z'),
        updatedAt: new Date('2026-08-06T00:00:00Z'),
        productsCount: 10,
      },
    ];

    categoryRepo = {
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let tenantFilter = '';
        const qb: any = {
          where: jest.fn().mockImplementation((_sql, params) => {
            if (params?.tenantId) tenantFilter = params.tenantId;
            return qb;
          }),
          addSelect: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          getRawAndEntities: jest.fn().mockImplementation(async () => {
            const entities = mockCategories.filter((c) => c.tenantId === tenantFilter);
            const raw = entities.map((c) => ({
              productsCount: c.productsCount,
              subcategoriesCount: mockCategories.filter((sub) => sub.parentId === c.id).length,
            }));
            return { entities, raw };
          }),
        };
        return qb;
      }),
    };

    const mockManager = {
      findOne: jest.fn().mockImplementation(async (entityClass, { where }) => {
        return (
          mockCategories.find((c) => {
            return Object.entries(where).every(([k, v]) => (c as any)[k] === v);
          }) || null
        );
      }),
      find: jest.fn().mockImplementation(async (entityClass, { where }) => {
        return mockCategories.filter((c) => {
          return Object.entries(where).every(([k, v]) => {
            if (v === null || (typeof v === 'object' && v !== null && (v as any)._type === 'isNull')) {
              return c[k] === null || c[k] === undefined;
            }
            return (c as any)[k] === v;
          });
        });
      }),
      save: jest.fn().mockImplementation(async (entity) => {
        const idx = mockCategories.findIndex((c) => c.id === entity.id);
        if (idx >= 0) {
          mockCategories[idx] = { ...mockCategories[idx], ...entity };
          return mockCategories[idx];
        }
        mockCategories.push(entity);
        return entity;
      }),
      update: jest.fn().mockImplementation(async (entityClass, criteria, partial) => {
        mockCategories.forEach((c) => {
          const match = Object.entries(criteria).every(([k, v]) => (c as any)[k] === v);
          if (match) {
            Object.assign(c, partial);
          }
        });
        return { affected: 1 };
      }),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCategoryTreeService,
        ReorderCategoryService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    treeService = module.get<GetCategoryTreeService>(GetCategoryTreeService);
    reorderService = module.get<ReorderCategoryService>(ReorderCategoryService);
  });

  describe('1. Recursive Tree Construction', () => {
    it('should build hierarchical tree with root nodes and nested children', async () => {
      const tree = await treeService.execute(tenantA);

      expect(tree).toBeDefined();
      expect(tree.length).toBe(2); // Fashion, Electronics

      const fashion = tree.find((t) => t.id === 'cat-fashion');
      expect(fashion).toBeDefined();
      expect(fashion?.children.length).toBe(2); // Men's Fashion, Women's Fashion

      const mens = fashion?.children.find((c) => c.id === 'cat-mens');
      expect(mens).toBeDefined();
      expect(mens?.children.length).toBe(1); // Shirts
      expect(mens?.children[0].id).toBe('cat-shirts');
    });

    it('should isolate store categories in tree view', async () => {
      const treeA = await treeService.execute(tenantA);
      const treeB = await treeService.execute(tenantB);

      expect(treeA.every((c) => c.tenantId === tenantA)).toBe(true);
      expect(treeB.length).toBe(1);
      expect(treeB[0].id).toBe('cat-store-b');
    });
  });

  describe('2. Sibling Reordering', () => {
    it('should reorder siblings within the same parent', async () => {
      await reorderService.execute(tenantA, {
        categoryId: 'cat-womens',
        newParentId: 'cat-fashion',
        newSortOrder: 0, // Move Women's Fashion before Men's Fashion
      });

      const womens = mockCategories.find((c) => c.id === 'cat-womens');
      const mens = mockCategories.find((c) => c.id === 'cat-mens');

      expect(womens.sortOrder).toBe(0);
      expect(mens.sortOrder).toBe(1);
    });
  });

  describe('3. Move Category to New Parent', () => {
    it('should move a category under another parent category', async () => {
      await reorderService.execute(tenantA, {
        categoryId: 'cat-shirts',
        newParentId: 'cat-womens', // Move Shirts from Men's to Women's
        newSortOrder: 0,
      });

      const shirts = mockCategories.find((c) => c.id === 'cat-shirts');
      expect(shirts.parentId).toBe('cat-womens');
    });
  });

  describe('4. Move Subcategory to Root', () => {
    it('should move a subcategory to root level (parentId = null)', async () => {
      await reorderService.execute(tenantA, {
        categoryId: 'cat-mens',
        newParentId: null, // Move Men's Fashion to Root
        newSortOrder: 2,
      });

      const mens = mockCategories.find((c) => c.id === 'cat-mens');
      expect(mens.parentId).toBeFalsy();
    });
  });

  describe('5. Hierarchy Safety & Circular Protection', () => {
    it('should reject setting a category as its own parent', async () => {
      await expect(
        reorderService.execute(tenantA, {
          categoryId: 'cat-fashion',
          newParentId: 'cat-fashion',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject moving an ancestor category under one of its descendants (circular hierarchy)', async () => {
      // Fashion -> Men's Fashion -> Shirts
      // Moving Fashion under Shirts MUST fail!
      await expect(
        reorderService.execute(tenantA, {
          categoryId: 'cat-fashion',
          newParentId: 'cat-shirts',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject moving a category belonging to another tenant', async () => {
      await expect(
        reorderService.execute(tenantA, {
          categoryId: 'cat-store-b',
          newParentId: 'cat-fashion',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject moving category under a cross-tenant parent', async () => {
      await expect(
        reorderService.execute(tenantA, {
          categoryId: 'cat-fashion',
          newParentId: 'cat-store-b',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
