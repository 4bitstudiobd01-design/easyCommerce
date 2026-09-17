import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
import { ProductSlugService } from './product-slug.service';
import { CreateCategoryService } from './create-category.service';
import { UpdateCategoryService } from './update-category.service';
import { DeleteCategoryService } from './delete-category.service';
import { FindCategoryByIdService } from './find-category-by-id.service';
import { ListCategoriesService } from './list-categories.service';
import { GetCategoryTreeService } from './get-category-tree.service';
import { ReorderCategoryService } from './reorder-category.service';
import { BulkMoveCategoriesService } from './bulk-move-categories.service';
import { BulkDeleteCategoriesService } from './bulk-delete-categories.service';
import { ExportCategoriesService } from './export-categories.service';
import { ImportCategoriesService } from './import-categories.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('Category Module Security, Cross-Tenant Isolation & Edge Cases (Chunk 9)', () => {
  const storeA = 'tenant-store-alpha';
  const storeB = 'tenant-store-beta';

  let createService: CreateCategoryService;
  let updateService: UpdateCategoryService;
  let deleteService: DeleteCategoryService;
  let findByIdService: FindCategoryByIdService;
  let listService: ListCategoriesService;
  let treeService: GetCategoryTreeService;
  let reorderService: ReorderCategoryService;
  let bulkMoveService: BulkMoveCategoriesService;
  let bulkDeleteService: BulkDeleteCategoriesService;
  let exportService: ExportCategoriesService;
  let importService: ImportCategoriesService;

  let categoriesDb: CategoryEntity[] = [];
  let productsDb: ProductEntity[] = [];

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (callback) => {
      const mockManager = {
        findOne: jest.fn().mockImplementation(async (entity, opts) => {
          if (entity === CategoryEntity) {
            return (
              categoriesDb.find((c) => {
                return Object.entries(opts.where).every(([k, v]) => (c as any)[k] === v);
              }) || null
            );
          }
          return null;
        }),
        find: jest.fn().mockImplementation(async (entity, opts) => {
          if (entity === CategoryEntity) {
            return categoriesDb.filter((c) => {
              if (opts?.where?.tenantId && c.tenantId !== opts.where.tenantId) return false;
              if (opts?.where?.parentId !== undefined && c.parentId !== opts.where.parentId) return false;
              return true;
            });
          }
          return [];
        }),
        save: jest.fn().mockImplementation(async (entity) => {
          const idx = categoriesDb.findIndex((c) => c.id === entity.id);
          if (idx >= 0) {
            categoriesDb[idx] = { ...categoriesDb[idx], ...entity };
            return categoriesDb[idx];
          }
          categoriesDb.push(entity);
          return entity;
        }),
        update: jest.fn().mockImplementation(async (entity, criteria, values) => {
          if (entity === CategoryEntity) {
            categoriesDb.forEach((c) => {
              if (Object.entries(criteria).every(([k, v]) => (c as any)[k] === v)) {
                Object.assign(c, values);
              }
            });
          }
          if (entity === ProductEntity) {
            productsDb.forEach((p) => {
              if (Object.entries(criteria).every(([k, v]) => (p as any)[k] === v)) {
                Object.assign(p, values);
              }
            });
          }
          return { affected: 1 };
        }),
        delete: jest.fn().mockImplementation(async (entity, criteria) => {
          if (entity === CategoryEntity) {
            if (criteria.id?._type === 'in') {
              categoriesDb = categoriesDb.filter(
                (c) => !(c.tenantId === criteria.tenantId && criteria.id._value.includes(c.id)),
              );
            } else {
              categoriesDb = categoriesDb.filter(
                (c) => !(c.tenantId === criteria.tenantId && c.id === criteria.id),
              );
            }
          }
          return { affected: 1 };
        }),
        createQueryBuilder: jest.fn().mockImplementation(() => ({
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        })),
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === CategoryEntity) {
            return {
              find: jest.fn().mockImplementation(async ({ where }) => {
                return categoriesDb.filter((c) => c.tenantId === where.tenantId);
              }),
              create: jest.fn().mockImplementation((dto) => ({ id: `cat-${Date.now()}`, ...dto })),
              save: jest.fn().mockImplementation(async (cat) => {
                const idx = categoriesDb.findIndex((c) => c.id === cat.id);
                if (idx >= 0) {
                  categoriesDb[idx] = { ...categoriesDb[idx], ...cat };
                  return categoriesDb[idx];
                }
                categoriesDb.push(cat);
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
    // Reset test database records with clear tenant separation
    categoriesDb = [
      // Store A categories
      {
        id: 'cat-a-root',
        name: 'Fashion Store A',
        slug: 'fashion',
        tenantId: storeA,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 0,
        isFeatured: true,
        isVisible: true,
        showInStorefront: true,
        seoTitle: 'Fashion A',
        metaDescription: 'Fashion A Desc',
        createdAt: new Date('2026-08-01T00:00:00Z'),
        updatedAt: new Date('2026-08-01T00:00:00Z'),
      } as CategoryEntity,
      {
        id: 'cat-a-child-1',
        name: "Men's Fashion A",
        slug: 'mens-fashion',
        tenantId: storeA,
        status: CategoryStatus.ACTIVE,
        parentId: 'cat-a-root',
        sortOrder: 0,
        isFeatured: false,
        isVisible: true,
        showInStorefront: true,
        createdAt: new Date('2026-08-02T00:00:00Z'),
        updatedAt: new Date('2026-08-02T00:00:00Z'),
      } as CategoryEntity,
      {
        id: 'cat-a-child-2',
        name: 'Shirts A',
        slug: 'shirts',
        tenantId: storeA,
        status: CategoryStatus.ACTIVE,
        parentId: 'cat-a-child-1',
        sortOrder: 0,
        isFeatured: false,
        isVisible: true,
        showInStorefront: true,
        createdAt: new Date('2026-08-03T00:00:00Z'),
        updatedAt: new Date('2026-08-03T00:00:00Z'),
      } as CategoryEntity,
      {
        id: 'cat-a-empty',
        name: 'Empty Showcase A',
        slug: 'empty-showcase',
        tenantId: storeA,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 1,
        isFeatured: false,
        isVisible: true,
        showInStorefront: true,
        createdAt: new Date('2026-08-04T00:00:00Z'),
        updatedAt: new Date('2026-08-04T00:00:00Z'),
      } as CategoryEntity,

      // Store B categories (same slug 'fashion' allowed under storeB due to composite tenant index)
      {
        id: 'cat-b-root',
        name: 'Fashion Store B',
        slug: 'fashion',
        tenantId: storeB,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 0,
        isFeatured: true,
        isVisible: true,
        showInStorefront: true,
        createdAt: new Date('2026-08-05T00:00:00Z'),
        updatedAt: new Date('2026-08-05T00:00:00Z'),
      } as CategoryEntity,
    ];

    productsDb = [
      { id: 'prod-a-1', name: 'Cotton Shirt A', categoryId: 'cat-a-child-2', tenantId: storeA } as ProductEntity,
      { id: 'prod-a-2', name: 'Polo Shirt A', categoryId: 'cat-a-child-2', tenantId: storeA } as ProductEntity,
      { id: 'prod-b-1', name: 'Silk Shirt B', categoryId: 'cat-b-root', tenantId: storeB } as ProductEntity,
    ];

    const categoryRepo = {
      find: jest.fn().mockImplementation(async (opts) => {
        if (!opts?.where) return categoriesDb;
        return categoriesDb.filter((c) => {
          if (opts.where.tenantId && c.tenantId !== opts.where.tenantId) return false;
          if (opts.where.slug && c.slug !== opts.where.slug) return false;
          if (opts.where.parentId !== undefined && c.parentId !== opts.where.parentId) return false;
          if (opts.where.id && opts.where.id._type === 'in') {
            return opts.where.id._value.includes(c.id);
          }
          if (opts.where.id && c.id !== opts.where.id) return false;
          return true;
        });
      }),
      findOne: jest.fn().mockImplementation(async (opts) => {
        if (!opts?.where) return null;
        return (
          categoriesDb.find((c) => {
            return Object.entries(opts.where).every(([k, v]) => (c as any)[k] === v);
          }) || null
        );
      }),
      create: jest.fn().mockImplementation((dto) => ({
        id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (entity) => {
        const idx = categoriesDb.findIndex((c) => c.id === entity.id);
        if (idx >= 0) {
          categoriesDb[idx] = { ...categoriesDb[idx], ...entity };
          return categoriesDb[idx];
        }
        categoriesDb.push(entity);
        return entity;
      }),
      remove: jest.fn().mockImplementation(async (entity) => {
        categoriesDb = categoriesDb.filter((c) => c.id !== entity.id);
        return entity;
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let tenant = storeA;
        let parentCond: any = null;
        const qb: any = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockImplementation((cond: string, params: any) => {
            if (params?.tenantId) tenant = params.tenantId;
            return qb;
          }),
          andWhere: jest.fn().mockImplementation((cond: string, params: any) => {
            if (params?.tenantId) tenant = params.tenantId;
            if (params?.parentId !== undefined) parentCond = params.parentId;
            return qb;
          }),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getRawAndEntities: jest.fn().mockImplementation(async () => {
            const entities = categoriesDb.filter((c) => {
              if (c.tenantId !== tenant) return false;
              if (parentCond !== null && c.parentId !== parentCond) return false;
              return true;
            });
            const raw = entities.map((c) => ({
              productsCount: String(productsDb.filter((p) => p.categoryId === c.id).length),
            }));
            return { entities, raw };
          }),
          getCount: jest.fn().mockImplementation(async () => {
            return categoriesDb.filter((c) => c.tenantId === tenant).length;
          }),
        };
        return qb;
      }),
      count: jest.fn().mockImplementation(async (opts) => {
        if (!opts?.where) return categoriesDb.length;
        return categoriesDb.filter((c) => {
          return Object.entries(opts.where).every(([k, v]) => (c as any)[k] === v);
        }).length;
      }),
      update: jest.fn().mockImplementation(async (criteria, values) => {
        categoriesDb.forEach((c) => {
          if (Object.entries(criteria).every(([k, v]) => (c as any)[k] === v)) {
            Object.assign(c, values);
          }
        });
        return { affected: 1 };
      }),
    };

    const productRepo = {
      find: jest.fn().mockImplementation(async ({ where }) => {
        return productsDb.filter((p) => p.tenantId === where.tenantId);
      }),
      count: jest.fn().mockImplementation(async ({ where }) => {
        return productsDb.filter((p) => {
          if (where.tenantId && p.tenantId !== where.tenantId) return false;
          if (where.categoryId && p.categoryId !== where.categoryId) return false;
          return true;
        }).length;
      }),
      update: jest.fn().mockImplementation(async (criteria, values) => {
        productsDb.forEach((p) => {
          if (Object.entries(criteria).every(([k, v]) => (p as any)[k] === v)) {
            Object.assign(p, values);
          }
        });
        return { affected: 1 };
      }),
    };

    const slugService = {
      generateSlug: jest.fn().mockImplementation(async (name) => {
        return name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryService,
        UpdateCategoryService,
        DeleteCategoryService,
        FindCategoryByIdService,
        ListCategoriesService,
        GetCategoryTreeService,
        ReorderCategoryService,
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

    createService = module.get<CreateCategoryService>(CreateCategoryService);
    updateService = module.get<UpdateCategoryService>(UpdateCategoryService);
    deleteService = module.get<DeleteCategoryService>(DeleteCategoryService);
    findByIdService = module.get<FindCategoryByIdService>(FindCategoryByIdService);
    listService = module.get<ListCategoriesService>(ListCategoriesService);
    treeService = module.get<GetCategoryTreeService>(GetCategoryTreeService);
    reorderService = module.get<ReorderCategoryService>(ReorderCategoryService);
    bulkMoveService = module.get<BulkMoveCategoriesService>(BulkMoveCategoriesService);
    bulkDeleteService = module.get<BulkDeleteCategoriesService>(BulkDeleteCategoriesService);
    exportService = module.get<ExportCategoriesService>(ExportCategoriesService);
    importService = module.get<ImportCategoriesService>(ImportCategoriesService);
  });

  describe('1. Cross-Tenant Security Attacks', () => {
    it('should reject Store A reading a Store B category', async () => {
      await expect(findByIdService.execute('cat-b-root', storeA)).rejects.toThrow(NotFoundException);
    });

    it('should reject Store A updating a Store B category', async () => {
      await expect(
        updateService.execute('cat-b-root', storeA, { name: 'Hacked Store B' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject Store A deleting a Store B category', async () => {
      await expect(deleteService.execute('cat-b-root', storeA)).rejects.toThrow(NotFoundException);
    });

    it('should reject Store A moving a Store A category under Store B category', async () => {
      await expect(
        updateService.execute('cat-a-child-1', storeA, { parentId: 'cat-b-root' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject Store A bulk moving Store B categories', async () => {
      await expect(
        bulkMoveService.execute(storeA, {
          categoryIds: ['cat-b-root'],
          newParentId: 'cat-a-root',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject Store A bulk deleting Store B categories', async () => {
      await expect(
        bulkDeleteService.execute(storeA, {
          categoryIds: ['cat-b-root'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should never include Store B categories in Store A CSV export', async () => {
      const csv = await exportService.execute(storeA);
      expect(csv).toContain('Fashion Store A');
      expect(csv).not.toContain('Fashion Store B');
    });
  });

  describe('2. Hierarchy Cycles & Broken Tree Prevention', () => {
    it('should reject setting category parentId to itself', async () => {
      await expect(
        updateService.execute('cat-a-root', storeA, { parentId: 'cat-a-root' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject moving parent into its direct child', async () => {
      // cat-a-root -> cat-a-child-1
      await expect(
        updateService.execute('cat-a-root', storeA, { parentId: 'cat-a-child-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject moving parent into deep descendant', async () => {
      // cat-a-root -> cat-a-child-1 -> cat-a-child-2
      await expect(
        updateService.execute('cat-a-root', storeA, { parentId: 'cat-a-child-2' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject circular reordering cycles', async () => {
      await expect(
        reorderService.execute(storeA, {
          categoryId: 'cat-a-root',
          newParentId: 'cat-a-child-2',
          newSortOrder: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Product Relationship Integrity & Safe Unlinking', () => {
    it('should block deletion when the category still has products assigned', async () => {
      // Products prod-a-1 and prod-a-2 are attached to cat-a-child-2
      expect(productsDb.filter((p) => p.categoryId === 'cat-a-child-2').length).toBe(2);

      await expect(deleteService.execute('cat-a-child-2', storeA)).rejects.toThrow(
        BadRequestException,
      );

      // Products remain untouched — deletion did not go through
      expect(productsDb.filter((p) => p.categoryId === 'cat-a-child-2').length).toBe(2);
    });

    it('should accurately compute product count for empty vs populated categories', async () => {
      const res = await listService.execute(storeA, { page: 1, limit: 10 });
      const emptyCat = res.data.find((c) => c.id === 'cat-a-empty');
      const populatedCat = res.data.find((c) => c.id === 'cat-a-child-2');

      expect(emptyCat?.productsCount).toBe(0);
      expect(populatedCat?.productsCount).toBe(2);
    });
  });

  describe('4. Input Sanitization & Formula Injection Protection', () => {
    it('should sanitize CSV formulas starting with = + - @ \\t in category export', async () => {
      categoriesDb.push({
        id: 'cat-formula-test',
        name: '=SUM(1,2)',
        slug: 'formula-slug',
        tenantId: storeA,
        status: CategoryStatus.ACTIVE,
        parentId: null,
        sortOrder: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CategoryEntity);

      const csv = await exportService.execute(storeA);
      // Prepend with single quote so Excel treats it as plain text string
      expect(csv).toContain("'=SUM(1,2)");
    });

    it('should preserve Unicode Bangla text in category name and SEO fields', async () => {
      const created = await createService.execute(storeA, {
        name: 'সালোয়ার কামিজ ও থ্রি-পিস',
        description: 'প্রিমিয়াম ডিজাইনার থ্রি-পিস কালেকশন',
        seoTitle: 'সালোয়ার কামিজ কালেকশন',
        metaDescription: 'সেরা মানের থ্রি-পিস কিনুন অনলাইনে।',
      });

      expect(created.name).toBe('সালোয়ার কামিজ ও থ্রি-পিস');
      expect(created.description).toBe('প্রিমিয়াম ডিজাইনার থ্রি-পিস কালেকশন');
    });
  });

  describe('5. CSV Import Edge Cases', () => {
    it('should reject CSV with circular loop (A -> B -> A)', async () => {
      const csv = `Name,Slug,ParentSlug\n"Cat Alpha","cat-alpha","cat-beta"\n"Cat Beta","cat-beta","cat-alpha"`;
      const preview = await importService.preview(storeA, csv);
      expect(preview.invalidRows).toBeGreaterThan(0);
      expect(preview.errors.some((e) => e.reason.includes('Circular hierarchy'))).toBe(true);
    });

    it('should reject CSV with duplicate slugs in different rows', async () => {
      const csv = `Name,Slug\n"First Category","shared-slug"\n"Second Category","shared-slug"`;
      const preview = await importService.preview(storeA, csv);
      expect(preview.invalidRows).toBe(1);
      expect(preview.errors.some((e) => e.reason.includes('Duplicate slug'))).toBe(true);
    });

    it('should execute topologically so parent categories are created before children', async () => {
      const csv = `Name,Slug,ParentSlug\n"Grandchild","grandchild","child"\n"Parent","parent",""\n"Child","child","parent"`;
      const result = await importService.execute(storeA, {
        csvContent: csv,
        mode: 'CREATE_ONLY',
      });

      expect(result.createdCount).toBe(3);
      expect(result.failedCount).toBe(0);
    });
  });
});
