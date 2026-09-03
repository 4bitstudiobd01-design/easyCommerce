import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreateProductService } from './create-product.service';
import { ProductEntity } from '../entities/product.entity';
import { CategoryEntity } from '../entities/category.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../inventory/entities/inventory-movement.entity';
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';
import { ProductSlugService } from './product-slug.service';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';

describe('CreateProductService', () => {
  let service: CreateProductService;
  let productRepo: any;
  let imageRepo: any;
  let stockRepo: any;
  let movementRepo: any;
  let warehouseRepo: any;
  let slugService: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    productRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'prod-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn().mockImplementation(() => Promise.resolve({
        id: 'prod-1',
        name: 'Test Product',
        slug: 'test-product',
        productType: ProductType.PHYSICAL,
        status: ProductStatus.DRAFT,
        tenantId: mockTenantId,
      })),
    };

    imageRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'img-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    stockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'stock-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    movementRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'mov-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    slugService = {
      generateSlug: jest.fn().mockResolvedValue('test-product'),
    };

    warehouseRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'wh-1', tenantId: mockTenantId }),
      create: jest.fn().mockImplementation((dto) => ({ id: 'wh-1', ...dto })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: {
            findOne: jest.fn().mockImplementation(({ where }) => {
              if (where?.id === 'cat-invalid') return Promise.resolve(null);
              return Promise.resolve({ id: where?.id || 'cat-1', tenantId: where?.tenantId || mockTenantId, name: 'Mock Cat' });
            }),
          },
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

    service = module.get<CreateProductService>(CreateProductService);
  });

  it('should create product in DRAFT status and PHYSICAL type by default', async () => {
    const dto = { name: 'Test Product' };

    await service.execute(mockTenantId, dto);

    expect(slugService.generateSlug).toHaveBeenCalledWith('Test Product', mockTenantId);
    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Product',
        slug: 'test-product',
        productType: ProductType.PHYSICAL,
        status: ProductStatus.DRAFT,
        isPublished: false,
        tenantId: mockTenantId,
      }),
    );
  });

  it('should allow specifying custom status (e.g. ACTIVE) and productType (e.g. DIGITAL)', async () => {
    const dto = {
      name: 'E-Book PDF',
      productType: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      basePrice: 499,
    };

    await service.execute(mockTenantId, dto);

    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'E-Book PDF',
        productType: ProductType.DIGITAL,
        status: ProductStatus.ACTIVE,
        isPublished: true,
        tenantId: mockTenantId,
      }),
    );
  });

  it('should reject publishing a non-variant product without a selling price', async () => {
    await expect(
      service.execute(mockTenantId, { name: 'No Price Product', status: ProductStatus.ACTIVE }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject a compare-at price that is not above the selling price', async () => {
    await expect(
      service.execute(mockTenantId, { name: 'Bad Compare', basePrice: 1000, compareAtPrice: 900 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should accept a compare-at price above the selling price', async () => {
    await expect(
      service.execute(mockTenantId, { name: 'Good Compare', basePrice: 1000, compareAtPrice: 1500 }),
    ).resolves.toBeDefined();
  });

  it('should allow publishing a variant product without a product-level price', async () => {
    const dto = {
      name: 'T-Shirt',
      status: ProductStatus.ACTIVE,
      hasVariants: true,
    };

    await service.execute(mockTenantId, dto);

    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'T-Shirt', hasVariants: true, status: ProductStatus.ACTIVE }),
    );
  });

  it('should not create any product variant on plain product creation', async () => {
    await service.execute(mockTenantId, { name: 'Plain Product', basePrice: 100 });

    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ hasVariants: false }),
    );
  });

  it('should support creating a SERVICE product type', async () => {
    const dto = {
      name: 'Consulting Session',
      productType: ProductType.SERVICE,
      status: ProductStatus.DRAFT,
    };

    await service.execute(mockTenantId, dto);

    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Consulting Session',
        productType: ProductType.SERVICE,
        status: ProductStatus.DRAFT,
        isPublished: false,
        tenantId: mockTenantId,
      }),
    );
  });

  it('should generate custom slug when explicit slug is provided', async () => {
    slugService.generateSlug.mockResolvedValue('custom-polo-shirt');
    const dto = {
      name: 'Polo Shirt',
      slug: 'custom-polo-shirt',
    };

    await service.execute(mockTenantId, dto);

    expect(slugService.generateSlug).toHaveBeenCalledWith('custom-polo-shirt', mockTenantId);
  });

  it('should throw BadRequestException if product name is empty or missing', async () => {
    await expect(service.execute(mockTenantId, { name: '   ' })).rejects.toThrow(BadRequestException);
  });
});
