import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductEntity } from '../entities/product.entity';
import { ListCategoriesService } from './list-categories.service';
import { GetCategoryKpisService } from './get-category-kpis.service';
import { ListParentCategoriesService } from './list-parent-categories.service';
import { CategoryStatus } from '../enums/category-status.enum';

describe('Category List + KPI + Search + Filter (Chunk 2)', () => {
  let listCategoriesService: ListCategoriesService;
  let getCategoryKpisService: GetCategoryKpisService;
  let listParentCategoriesService: ListParentCategoriesService;

  let categoryRepo: any;
  let dataSource: any;

  const tenantA = 'tenant-uuid-store-a';
  const tenantB = 'tenant-uuid-store-b';

  // Seed test dataset
  const mockCategories: any[] = [
    {
      id: 'cat-1',
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'All fashion items',
      parentId: null,
      status: CategoryStatus.ACTIVE,
      sortOrder: 1,
      tenantId: tenantA,
      createdAt: new Date('2026-08-01T00:00:00Z'),
      updatedAt: new Date('2026-08-01T00:00:00Z'),
      productsCount: 124,
      subcategoriesCount: 2,
    },
    {
      id: 'cat-2',
      name: 'Men Clothing',
      slug: 'men-clothing',
      description: 'Men clothing',
      parentId: 'cat-1',
      parentCategory: { id: 'cat-1', name: 'Fashion & Apparel', slug: 'fashion-apparel' },
      status: CategoryStatus.ACTIVE,
      sortOrder: 2,
      tenantId: tenantA,
      createdAt: new Date('2026-08-02T00:00:00Z'),
      updatedAt: new Date('2026-08-02T00:00:00Z'),
      productsCount: 48,
      subcategoriesCount: 0,
    },
    {
      id: 'cat-3',
      name: 'Women Dresses',
      slug: 'women-dresses',
      description: 'Women clothing',
      parentId: 'cat-1',
      parentCategory: { id: 'cat-1', name: 'Fashion & Apparel', slug: 'fashion-apparel' },
      status: CategoryStatus.DRAFT,
      sortOrder: 3,
      tenantId: tenantA,
      createdAt: new Date('2026-08-03T00:00:00Z'),
      updatedAt: new Date('2026-08-03T00:00:00Z'),
      productsCount: 0, // Empty category
      subcategoriesCount: 0,
    },
    {
      id: 'cat-4',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Devices & Gadgets',
      parentId: null,
      status: CategoryStatus.ACTIVE,
      sortOrder: 4,
      tenantId: tenantA,
      createdAt: new Date('2026-08-04T00:00:00Z'),
      updatedAt: new Date('2026-08-04T00:00:00Z'),
      productsCount: 30,
      subcategoriesCount: 0,
    },
    {
      id: 'cat-5',
      name: 'Store B Exclusive',
      slug: 'store-b-exclusive',
      parentId: null,
      status: CategoryStatus.ACTIVE,
      sortOrder: 1,
      tenantId: tenantB,
      createdAt: new Date('2026-08-05T00:00:00Z'),
      updatedAt: new Date('2026-08-05T00:00:00Z'),
      productsCount: 10,
      subcategoriesCount: 0,
    },
  ];

  beforeEach(async () => {
    // Mock QueryBuilder for TypeORM
    categoryRepo = {
      createQueryBuilder: jest.fn().mockImplementation((alias) => {
        let tenantFilter = '';
        let andWheres: Array<{ sql: string; params: any }> = [];
        let skipVal = 0;
        let takeVal = 20;
        let orderBys: Array<{ col: string; dir: string }> = [];

        const qb: any = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockImplementation((sql, params) => {
            if (params?.tenantId) tenantFilter = params.tenantId;
            return qb;
          }),
          andWhere: jest.fn().mockImplementation((sql, params) => {
            andWheres.push({ sql, params });
            return qb;
          }),
          orderBy: jest.fn().mockImplementation((col, dir) => {
            orderBys = [{ col, dir }];
            return qb;
          }),
          addOrderBy: jest.fn().mockImplementation((col, dir) => {
            orderBys.push({ col, dir });
            return qb;
          }),
          skip: jest.fn().mockImplementation((val) => {
            skipVal = val;
            return qb;
          }),
          take: jest.fn().mockImplementation((val) => {
            takeVal = val;
            return qb;
          }),
          getCount: jest.fn().mockImplementation(async () => {
            return mockCategories.filter((c) => {
              if (c.tenantId !== tenantFilter) return false;
              for (const w of andWheres) {
                if (w.sql.includes('ILIKE')) {
                  const s = w.params.s.replace(/%/g, '').toLowerCase();
                  if (!c.name.toLowerCase().includes(s) && !c.slug.toLowerCase().includes(s)) {
                    return false;
                  }
                }
                if (w.sql.includes('c.status = :status')) {
                  if (c.status !== w.params.status) return false;
                }
                if (w.sql.includes('c.parentId IS NULL')) {
                  if (c.parentId !== null) return false;
                }
                if (w.sql.includes('c.parentId = :parentId')) {
                  if (c.parentId !== w.params.parentId) return false;
                }
              }
              return true;
            }).length;
          }),
          getRawAndEntities: jest.fn().mockImplementation(async () => {
            let filtered = mockCategories.filter((c) => {
              if (c.tenantId !== tenantFilter) return false;
              for (const w of andWheres) {
                if (w.sql.includes('ILIKE')) {
                  const s = w.params.s.replace(/%/g, '').toLowerCase();
                  if (!c.name.toLowerCase().includes(s) && !c.slug.toLowerCase().includes(s)) {
                    return false;
                  }
                }
                if (w.sql.includes('c.status = :status')) {
                  if (c.status !== w.params.status) return false;
                }
                if (w.sql.includes('c.parentId IS NULL')) {
                  if (c.parentId !== null) return false;
                }
                if (w.sql.includes('c.parentId = :parentId')) {
                  if (c.parentId !== w.params.parentId) return false;
                }
              }
              return true;
            });

            // Handle sorting
            if (orderBys.length > 0) {
              const primary = orderBys[0];
              filtered.sort((a, b) => {
                let valA = a[primary.col.replace(/c\./g, '').replace(/"/g, '')];
                let valB = b[primary.col.replace(/c\./g, '').replace(/"/g, '')];
                if (valA < valB) return primary.dir === 'DESC' ? 1 : -1;
                if (valA > valB) return primary.dir === 'DESC' ? -1 : 1;
                return 0;
              });
            }

            const paged = filtered.slice(skipVal, skipVal + takeVal);
            const entities = paged.map((item) => ({
              ...item,
            }));
            const raw = paged.map((item) => ({
              productsCount: item.productsCount,
              subcategoriesCount: item.subcategoriesCount,
            }));

            return { entities, raw };
          }),
        };

        return qb;
      }),
      find: jest.fn().mockImplementation(async ({ where }) => {
        return mockCategories.filter((c) => {
          if (c.tenantId !== where.tenantId) return false;
          if (where.parentId && c.parentId !== null) return false;
          return true;
        });
      }),
    };

    dataSource = {
      query: jest.fn().mockImplementation(async (sql, params) => {
        const tId = params[0];
        const tenantCats = mockCategories.filter((c) => c.tenantId === tId);
        const total = tenantCats.length;
        const active = tenantCats.filter((c) => c.status === CategoryStatus.ACTIVE).length;
        const parents = tenantCats.filter((c) => c.parentId === null).length;
        const empty = tenantCats.filter((c) => c.productsCount === 0).length;

        return [
          {
            totalCategories: total,
            activeCategories: active,
            parentCategories: parents,
            emptyCategories: empty,
          },
        ];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCategoriesService,
        GetCategoryKpisService,
        ListParentCategoriesService,
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

    listCategoriesService = module.get<ListCategoriesService>(ListCategoriesService);
    getCategoryKpisService = module.get<GetCategoryKpisService>(GetCategoryKpisService);
    listParentCategoriesService = module.get<ListParentCategoriesService>(ListParentCategoriesService);
  });

  describe('1. Category List & Server-Side Pagination', () => {
    it('should return paginated categories for tenant with correct metadata', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        page: 1,
        limit: 2,
      });

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(4);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should navigate to page 2', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        page: 2,
        limit: 2,
      });

      expect(result.data.length).toBe(2);
      expect(result.meta.page).toBe(2);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(true);
    });
  });

  describe('2. Search by Name and Slug', () => {
    it('should filter categories matching search query by name', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        search: 'Men Clothing',
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Men Clothing');
    });

    it('should filter categories matching search query by slug', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        search: 'electronics',
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].slug).toBe('electronics');
    });
  });

  describe('3. Status Filter', () => {
    it('should filter by ACTIVE status', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        status: CategoryStatus.ACTIVE,
      });

      expect(result.data.every((c) => c.status === CategoryStatus.ACTIVE)).toBe(true);
      expect(result.data.length).toBe(3);
    });

    it('should filter by DRAFT status', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        status: CategoryStatus.DRAFT,
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Women Dresses');
    });
  });

  describe('4. Parent Category Filter', () => {
    it('should filter by root categories (parentId = null)', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        parentId: 'root',
      });

      expect(result.data.every((c) => c.parentId === null)).toBe(true);
      expect(result.data.length).toBe(2); // Fashion & Apparel, Electronics
    });

    it('should filter by specific parent ID', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        parentId: 'cat-1',
      });

      expect(result.data.length).toBe(2); // Men's Fashion, Women's Fashion
      expect(result.data.every((c) => c.parentId === 'cat-1')).toBe(true);
    });
  });

  describe('5. Sorting & Whitelisting', () => {
    it('should sort by name ASC', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      expect(result.data[0].name).toBe('Electronics');
    });

    it('should sort by productsCount DESC', async () => {
      const result = await listCategoriesService.execute(tenantA, {
        sortBy: 'productsCount',
        sortOrder: 'DESC',
      });

      expect(result.data[0].productsCount).toBe(124);
      expect(result.data[0].name).toBe('Fashion & Apparel');
    });
  });

  describe('6. Category KPI Calculations', () => {
    it('should accurately calculate all 4 KPIs for Store A', async () => {
      const kpis = await getCategoryKpisService.execute(tenantA);

      expect(kpis.totalCategories).toBe(4);
      expect(kpis.activeCategories).toBe(3);
      expect(kpis.activePercentage).toBe(75); // (3 / 4) * 100 = 75%
      expect(kpis.parentCategories).toBe(2); // cat-1, cat-4
      expect(kpis.emptyCategories).toBe(1); // cat-3 has 0 products
    });

    it('should accurately calculate KPIs for Store B under tenant isolation', async () => {
      const kpis = await getCategoryKpisService.execute(tenantB);

      expect(kpis.totalCategories).toBe(1);
      expect(kpis.activeCategories).toBe(1);
      expect(kpis.activePercentage).toBe(100);
      expect(kpis.parentCategories).toBe(1);
      expect(kpis.emptyCategories).toBe(0);
    });
  });

  describe('7. Parent Categories Dropdown Service', () => {
    it('should return only root categories for the authenticated tenant', async () => {
      const parents = await listParentCategoriesService.execute(tenantA);

      expect(parents.length).toBe(2);
      expect(parents.every((p) => p.tenantId === tenantA && p.parentId === null)).toBe(true);
    });
  });

  describe('8. Tenant Isolation', () => {
    it('Store A queries must never return Store B categories', async () => {
      const resultA = await listCategoriesService.execute(tenantA, {
        search: 'Store B',
      });

      expect(resultA.data.length).toBe(0);
      expect(resultA.meta.total).toBe(0);
    });
  });
});
