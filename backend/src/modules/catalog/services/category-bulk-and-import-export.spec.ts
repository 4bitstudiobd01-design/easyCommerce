import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
import { ProductSlugService } from './product-slug.service';
import { BulkUpdateCategoryStatusService } from './bulk-update-category-status.service';
import { BulkMoveCategoriesService } from './bulk-move-categories.service';
import { BulkDeleteCategoriesService } from './bulk-delete-categories.service';
import { ExportCategoriesService } from './export-categories.service';
import { ImportCategoriesService } from './import-categories.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('Category Bulk Actions & Import/Export (Chunk 8)', () => {
  const tenantA = 'tenant-store-a';
  const tenantB = 'tenant-store-b';

  let bulkStatusService: BulkUpdateCategoryStatusService;
  let bulkMoveService: BulkMoveCategoriesService;
  let bulkDeleteService: BulkDeleteCategoriesService;
  let exportService: ExportCategoriesService;
  let importService: ImportCategoriesService;

  let mockCategories: any[] = [];
  let mockProducts: any[] = [];

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (callback) => {
      const mockManager = {
        createQueryBuilder: jest.fn().mockImplementation(() => ({
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 2 }),
        })),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === CategoryEntity) {
            return {
              find: jest.fn().mockImplementation(async ({ where }) => {
                return mockCategories.filter((c) => c.tenantId === where.tenantId);
              }),
              create: jest.fn().mockImplementation((dto) => ({ id: `cat-${Date.now()}`, ...dto })),
              save: jest.fn().mockImplementation(async (cat) => {
                const idx = mockCategories.findIndex((c) => c.id === cat.id);
                if (idx >= 0) {
                  mockCategories[idx] = { ...mockCategories[idx], ...cat };
                  return mockCategories[idx];
                }
                mockCategories.push(cat);
                return cat;
              }),
            };
          }
          return {};
        }),
      };
      return callback(mockManager);
    }),
  };

  beforeEach(async () => {
    mockCategories = [
      {
        id: 'cat-fashion',
        name: 'Fashion',
        slug: 'fashion',
        tenantId: tenantA,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 1,
        createdAt: new Date('2026-08-01T00:00:00Z'),
        updatedAt: new Date('2026-08-01T00:00:00Z'),
      },
      {
        id: 'cat-mens',
        name: "Men's Fashion",
        slug: 'mens-fashion',
        tenantId: tenantA,
        status: CategoryStatus.ACTIVE,
        parentId: 'cat-fashion',
        sortOrder: 2,
        createdAt: new Date('2026-08-02T00:00:00Z'),
        updatedAt: new Date('2026-08-02T00:00:00Z'),
      },
      {
        id: 'cat-shoes',
        name: 'Shoes',
        slug: 'shoes',
        tenantId: tenantA,
        status: CategoryStatus.ACTIVE,
        parentId: 'cat-mens',
        sortOrder: 3,
        createdAt: new Date('2026-08-03T00:00:00Z'),
        updatedAt: new Date('2026-08-03T00:00:00Z'),
      },
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        tenantId: tenantA,
        status: CategoryStatus.DRAFT,
        parentId: null,
        sortOrder: 4,
        createdAt: new Date('2026-08-04T00:00:00Z'),
        updatedAt: new Date('2026-08-04T00:00:00Z'),
      },
      {
        id: 'cat-store-b',
        name: 'Store B Category',
        slug: 'store-b-cat',
        tenantId: tenantB,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 1,
        createdAt: new Date('2026-08-05T00:00:00Z'),
        updatedAt: new Date('2026-08-05T00:00:00Z'),
      },
    ];

    mockProducts = [
      { id: 'prod-1', name: 'Cotton Shirt', categoryId: 'cat-mens', tenantId: tenantA },
      { id: 'prod-2', name: 'Sneakers', categoryId: 'cat-shoes', tenantId: tenantA },
    ];

    const categoryRepo = {
      find: jest.fn().mockImplementation(async ({ where }) => {
        if (!where) return mockCategories;
        return mockCategories.filter((c) => {
          if (where.tenantId && c.tenantId !== where.tenantId) return false;
          if (where.id && where.id._type === 'in') {
            return where.id._value.includes(c.id);
          }
          if (where.id && c.id !== where.id) return false;
          return true;
        });
      }),
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        return (
          mockCategories.find((c) => {
            return Object.entries(where).every(([k, v]) => (c as any)[k] === v);
          }) || null
        );
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let tenant = tenantA;
        const qb: any = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockImplementation((cond: string, params: any) => {
            if (params?.tenantId) tenant = params.tenantId;
            return qb;
          }),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          getRawAndEntities: jest.fn().mockImplementation(async () => {
            const entities = mockCategories.filter((c) => c.tenantId === tenant);
            const raw = entities.map((c) => ({ productsCount: '2' }));
            return { entities, raw };
          }),
        };
        return qb;
      }),
    };

    const productRepo = {
      find: jest.fn().mockImplementation(async ({ where }) => {
        return mockProducts.filter((p) => p.tenantId === where.tenantId);
      }),
    };

    const slugService = {
      generateSlug: jest.fn().mockImplementation(async (name) => name.toLowerCase().replace(/\s+/g, '-')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkUpdateCategoryStatusService,
        BulkMoveCategoriesService,
        BulkDeleteCategoriesService,
        ExportCategoriesService,
        ImportCategoriesService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepo,
        },
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: productRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ProductSlugService,
          useValue: slugService,
        },
      ],
    }).compile();

    bulkStatusService = module.get<BulkUpdateCategoryStatusService>(BulkUpdateCategoryStatusService);
    bulkMoveService = module.get<BulkMoveCategoriesService>(BulkMoveCategoriesService);
    bulkDeleteService = module.get<BulkDeleteCategoriesService>(BulkDeleteCategoriesService);
    exportService = module.get<ExportCategoriesService>(ExportCategoriesService);
    importService = module.get<ImportCategoriesService>(ImportCategoriesService);
  });

  describe('1. Bulk Status Updates', () => {
    it('should bulk update categories to ARCHIVED in transaction', async () => {
      const res = await bulkStatusService.execute(tenantA, {
        categoryIds: ['cat-fashion', 'cat-mens'],
        status: CategoryStatus.ARCHIVED,
      });

      expect(res.successCount).toBe(2);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when categoryIds is empty', async () => {
      await expect(
        bulkStatusService.execute(tenantA, {
          categoryIds: [],
          status: CategoryStatus.ACTIVE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating categories belonging to another store', async () => {
      await expect(
        bulkStatusService.execute(tenantA, {
          categoryIds: ['cat-store-b'],
          status: CategoryStatus.ACTIVE,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Bulk Move Categories', () => {
    it('should move multiple categories under a valid parent category', async () => {
      const res = await bulkMoveService.execute(tenantA, {
        categoryIds: ['cat-electronics'],
        newParentId: 'cat-fashion',
      });

      expect(res.successCount).toBe(1);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should move categories to root when newParentId is null', async () => {
      const res = await bulkMoveService.execute(tenantA, {
        categoryIds: ['cat-mens'],
        newParentId: null,
      });

      expect(res.successCount).toBe(1);
    });

    it('should reject moving a category under itself', async () => {
      await expect(
        bulkMoveService.execute(tenantA, {
          categoryIds: ['cat-fashion'],
          newParentId: 'cat-fashion',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject circular hierarchy movement (moving parent under its descendant)', async () => {
      // cat-fashion -> cat-mens -> cat-shoes
      // Attempting to move cat-fashion under cat-shoes must be rejected!
      await expect(
        bulkMoveService.execute(tenantA, {
          categoryIds: ['cat-fashion'],
          newParentId: 'cat-shoes',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Bulk Delete Categories', () => {
    it('should delete multiple categories and unlink subcategories/products', async () => {
      const res = await bulkDeleteService.execute(tenantA, {
        categoryIds: ['cat-mens', 'cat-shoes'],
      });

      expect(res.successCount).toBe(2);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should reject deleting categories from another tenant', async () => {
      await expect(
        bulkDeleteService.execute(tenantA, {
          categoryIds: ['cat-store-b'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. CSV Export', () => {
    it('should export categories with CSV formula injection sanitization', async () => {
      // Inject formula character in category name
      mockCategories.push({
        id: 'cat-formula',
        name: '=1+1 Dangerous',
        slug: 'dangerous-cat',
        tenantId: tenantA,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const csv = await exportService.execute(tenantA);

      expect(csv).toContain('"ID","Name","Slug"');
      // Must be prefixed with single quote to prevent spreadsheet formula execution
      expect(csv).toContain("'=1+1 Dangerous");
    });

    it('should properly escape double quotes and commas in CSV export', async () => {
      mockCategories.push({
        id: 'cat-escaped',
        name: 'Men "Super" Fashion, Special',
        slug: 'super-fashion',
        tenantId: tenantA,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 11,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const csv = await exportService.execute(tenantA);
      expect(csv).toContain('"Men ""Super"" Fashion, Special"');
    });

    it('should preserve Unicode Bangla text in CSV export', async () => {
      mockCategories.push({
        id: 'cat-bangla',
        name: 'পোশাক ও ফ্যাশন',
        slug: 'poshak-fashion',
        tenantId: tenantA,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const csv = await exportService.execute(tenantA);
      expect(csv).toContain('পোশাক ও ফ্যাশন');
    });
  });

  describe('5. CSV Import & Validation', () => {
    it('should validate CSV preview and return valid preview data', async () => {
      const csv = `Name,Slug,ParentSlug,Status\n"Home & Living","home-living","","ACTIVE"\n"Kitchen","kitchen","home-living","ACTIVE"`;

      const preview = await importService.preview(tenantA, csv);

      expect(preview.totalRows).toBe(2);
      expect(preview.validRows).toBe(2);
      expect(preview.invalidRows).toBe(0);
      expect(preview.previewData[0].name).toBe('Home & Living');
      expect(preview.previewData[1].parentSlug).toBe('home-living');
    });

    it('should detect duplicate slugs within the CSV file', async () => {
      const csv = `Name,Slug\n"First Category","same-slug"\n"Second Category","same-slug"`;

      const preview = await importService.preview(tenantA, csv);

      expect(preview.invalidRows).toBe(1);
      expect(preview.errors.some((e) => e.reason.includes('Duplicate slug'))).toBe(true);
    });

    it('should detect circular hierarchy in CSV file', async () => {
      // Loop: CatA -> CatB -> CatA
      const csv = `Name,Slug,ParentSlug\n"Cat A","cat-a","cat-b"\n"Cat B","cat-b","cat-a"`;

      const preview = await importService.preview(tenantA, csv);

      expect(preview.invalidRows).toBeGreaterThan(0);
      expect(preview.errors.some((e) => e.reason.includes('Circular hierarchy'))).toBe(true);
    });

    it('should execute import transactionally creating categories in topological order', async () => {
      const csv = `Name,Slug,ParentSlug,Status\n"Parent Root","parent-root","","ACTIVE"\n"Child Node","child-node","parent-root","ACTIVE"`;

      const result = await importService.execute(tenantA, {
        csvContent: csv,
        mode: 'CREATE_ONLY',
      });

      expect(result.createdCount).toBe(2);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });
});
