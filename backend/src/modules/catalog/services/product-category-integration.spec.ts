import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductEntity } from '../entities/product.entity';
import { CategoryEntity } from '../entities/category.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../inventory/entities/inventory-movement.entity';
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';
import { CreateProductService } from './create-product.service';
import { UpdateProductService } from './update-product.service';
import { ListProductsService } from './list-products.service';
import { FindCategoryByIdService } from './find-category-by-id.service';
import { ProductSlugService } from './product-slug.service';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';

describe('Product ↔ Category Integration (Chunk 7)', () => {
  const tenantA = 'tenant-store-a';
  const tenantB = 'tenant-store-b';

  let createProductService: CreateProductService;
  let updateProductService: UpdateProductService;
  let listProductsService: ListProductsService;
  let findCategoryByIdService: FindCategoryByIdService;

  let mockCategories: any[] = [];
  let mockProducts: any[] = [];

  beforeEach(async () => {
    mockCategories = [
      {
        id: 'cat-fashion',
        name: 'Fashion & Apparel',
        slug: 'fashion-apparel',
        tenantId: tenantA,
        status: 'ACTIVE',
      },
      {
        id: 'cat-electronics',
        name: 'Electronics',
        slug: 'electronics',
        tenantId: tenantA,
        status: 'ACTIVE',
      },
      {
        id: 'cat-store-b',
        name: 'Store B Category',
        slug: 'store-b-category',
        tenantId: tenantB,
        status: 'ACTIVE',
      },
    ];

    mockProducts = [
      {
        id: 'prod-shirt',
        name: 'Cotton Polo Shirt',
        slug: 'cotton-polo-shirt',
        sku: 'POLO-001',
        productType: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        categoryId: 'cat-fashion',
        tenantId: tenantA,
        createdAt: new Date('2026-08-01T00:00:00Z'),
        updatedAt: new Date('2026-08-01T00:00:00Z'),
      },
      {
        id: 'prod-phone',
        name: 'Smart Phone 15',
        slug: 'smart-phone-15',
        sku: 'PHONE-001',
        productType: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        categoryId: 'cat-electronics',
        tenantId: tenantA,
        createdAt: new Date('2026-08-02T00:00:00Z'),
        updatedAt: new Date('2026-08-02T00:00:00Z'),
      },
      {
        id: 'prod-b-item',
        name: 'Store B Gadget',
        slug: 'store-b-gadget',
        sku: 'GADGET-B',
        productType: ProductType.PHYSICAL,
        status: ProductStatus.ACTIVE,
        categoryId: 'cat-store-b',
        tenantId: tenantB,
        createdAt: new Date('2026-08-03T00:00:00Z'),
        updatedAt: new Date('2026-08-03T00:00:00Z'),
      },
    ];

    const categoryRepo = {
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        return (
          mockCategories.find((c) => {
            return Object.entries(where).every(([k, v]) => (c as any)[k] === v);
          }) || null
        );
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => {
        const qb: any = {
          where: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockImplementation(async () => {
            const count = mockProducts.filter((p) => p.categoryId === 'cat-fashion' && p.tenantId === tenantA).length;
            return { productsCount: count, subcategoriesCount: 0 };
          }),
        };
        return qb;
      }),
    };

    const productRepo = {
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        return (
          mockProducts.find((p) => {
            return Object.entries(where).every(([k, v]) => p[k] === v);
          }) || null
        );
      }),
      create: jest.fn().mockImplementation((dto) => ({
        id: `prod-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (entity) => {
        const idx = mockProducts.findIndex((p) => p.id === entity.id);
        if (idx >= 0) {
          mockProducts[idx] = { ...mockProducts[idx], ...entity, updatedAt: new Date() };
          return mockProducts[idx];
        }
        mockProducts.push(entity);
        return entity;
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let tenantFilter = tenantA;
        let catFilter: string | undefined = undefined;
        let searchFilter: string | undefined = undefined;
        let statusFilter: string | undefined = undefined;

        const qb: any = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockImplementation((cond: string, params: any) => {
            if (params?.tenantId) tenantFilter = params.tenantId;
            return qb;
          }),
          andWhere: jest.fn().mockImplementation((cond: string, params: any) => {
            if (params?.categoryId) catFilter = params.categoryId;
            if (params?.s) searchFilter = params.s.replace(/%/g, '').toLowerCase();
            if (params?.status) statusFilter = params.status;
            return qb;
          }),
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockImplementation(async () => {
            let filtered = mockProducts.filter((p) => p.tenantId === tenantFilter);
            if (catFilter) filtered = filtered.filter((p) => p.categoryId === catFilter);
            return filtered.length;
          }),
          getManyAndCount: jest.fn().mockImplementation(async () => {
            let filtered = mockProducts.filter((p) => p.tenantId === tenantFilter);
            if (catFilter) filtered = filtered.filter((p) => p.categoryId === catFilter);
            if (statusFilter) filtered = filtered.filter((p) => p.status === statusFilter);
            if (searchFilter) {
              filtered = filtered.filter(
                (p) =>
                  p.name.toLowerCase().includes(searchFilter!) ||
                  p.slug.toLowerCase().includes(searchFilter!) ||
                  (p.sku && p.sku.toLowerCase().includes(searchFilter!)),
              );
            }
            return [filtered, filtered.length];
          }),
          getRawMany: jest.fn().mockResolvedValue([
            { status: ProductStatus.ACTIVE, count: '2' },
            { status: ProductStatus.DRAFT, count: '0' },
            { status: ProductStatus.ARCHIVED, count: '0' },
          ]),
        };
        return qb;
      }),
    };

    const variantRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'var-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const imageRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'img-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const stockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'stock-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
    };

    const movementRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'mov-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const warehouseRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'wh-1', tenantId: tenantA }),
      create: jest.fn().mockImplementation((dto) => ({ id: 'wh-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const slugService = {
      generateSlug: jest.fn().mockImplementation(async (name) => name.toLowerCase().replace(/\s+/g, '-')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductService,
        UpdateProductService,
        ListProductsService,
        FindCategoryByIdService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepo,
        },
        {
          provide: getRepositoryToken(ProductVariantEntity),
          useValue: variantRepo,
        },
        {
          provide: getRepositoryToken(ProductImageEntity),
          useValue: imageRepo,
        },
        {
          provide: getRepositoryToken(CollectionEntity),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(InventoryStockEntity),
          useValue: stockRepo,
        },
        {
          provide: getRepositoryToken(InventoryMovementEntity),
          useValue: movementRepo,
        },
        {
          provide: getRepositoryToken(WarehouseEntity),
          useValue: warehouseRepo,
        },
        {
          provide: ProductSlugService,
          useValue: slugService,
        },
      ],
    }).compile();

    createProductService = module.get<CreateProductService>(CreateProductService);
    updateProductService = module.get<UpdateProductService>(UpdateProductService);
    listProductsService = module.get<ListProductsService>(ListProductsService);
    findCategoryByIdService = module.get<FindCategoryByIdService>(FindCategoryByIdService);
  });

  describe('1. Product → Category Assignment', () => {
    it('should assign a valid category during product creation', async () => {
      const product = await createProductService.execute(tenantA, {
        name: 'Denim Jacket',
        categoryId: 'cat-fashion',
        productType: ProductType.PHYSICAL,
        basePrice: 2500,
      });

      expect(product).toBeDefined();
      expect(product.name).toBe('Denim Jacket');
      expect(product.categoryId).toBe('cat-fashion');
      expect(product.tenantId).toBe(tenantA);
    });

    it('should allow creating an uncategorized product', async () => {
      const product = await createProductService.execute(tenantA, {
        name: 'Uncategorized Sample Item',
        productType: ProductType.PHYSICAL,
        basePrice: 500,
      });

      expect(product.categoryId).toBeUndefined();
    });
  });

  describe('2. Product Category Updates & Removal', () => {
    it('should change product category on update', async () => {
      const updateResult = await updateProductService.execute('prod-shirt', tenantA, {
        categoryId: 'cat-electronics',
      });

      expect(updateResult.categoryId).toBe('cat-electronics');
    });

    it('should remove category when passed empty string or none', async () => {
      const updateResult = await updateProductService.execute('prod-shirt', tenantA, {
        categoryId: '',
      });

      expect(updateResult.categoryId).toBeUndefined();
    });
  });

  describe('3. Category Filter & Product Query', () => {
    it('should filter product list by categoryId', async () => {
      const result = await listProductsService.execute(tenantA, {
        categoryId: 'cat-fashion',
      } as any);

      expect(result.data).toBeDefined();
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('prod-shirt');
    });

    it('should support search and category filter simultaneously', async () => {
      const result = await listProductsService.execute(tenantA, {
        categoryId: 'cat-fashion',
        search: 'polo',
      } as any);

      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Cotton Polo Shirt');
    });

    it('should return empty array for empty category', async () => {
      const result = await listProductsService.execute(tenantA, {
        categoryId: 'cat-nonexistent',
      } as any);

      expect(result.data.length).toBe(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('4. Security & Tenant Isolation', () => {
    it('should reject assigning Store B category to Store A product on create', async () => {
      await expect(
        createProductService.execute(tenantA, {
          name: 'Hacked Product',
          categoryId: 'cat-store-b',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating Store A product with Store B category on update', async () => {
      await expect(
        updateProductService.execute('prod-shirt', tenantA, {
          categoryId: 'cat-store-b',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should isolate product queries so Store A cannot see Store B products', async () => {
      const result = await listProductsService.execute(tenantA);
      const containsStoreB = result.data.some((p) => p.tenantId === tenantB);
      expect(containsStoreB).toBe(false);
    });
  });
});
