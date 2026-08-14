import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetProductVariantInventoryService } from './get-product-variant-inventory.service';
import { InventoryDomainService } from './inventory-domain.service';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

describe('GetProductVariantInventoryService', () => {
  let service: GetProductVariantInventoryService;
  let productRepo: any;
  let variantRepo: any;
  let stockRepo: any;

  const mockProduct = {
    id: 'prod-iphone15',
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    sku: 'IP15PM',
    trackInventory: true,
    allowBackorder: false,
    lowStockThreshold: 10,
    hasVariants: true,
    tenantId: 'tenant-1',
    category: { name: 'Mobiles & Tablets' },
    images: [{ url: 'https://img.com/iphone.jpg', isPrimary: true, sortOrder: 0 }],
  };

  const mockVariants = [
    {
      id: 'var-256-nt',
      title: '256GB / Natural Titanium',
      sku: 'IP15PM-256-NT',
      productId: 'prod-iphone15',
      tenantId: 'tenant-1',
      createdAt: new Date('2026-08-01'),
    },
    {
      id: 'var-256-bl',
      title: '256GB / Blue Titanium',
      sku: 'IP15PM-256-BL',
      productId: 'prod-iphone15',
      tenantId: 'tenant-1',
      createdAt: new Date('2026-08-02'),
    },
    {
      id: 'var-512-nt',
      title: '512GB / Natural Titanium',
      sku: 'IP15PM-512-NT',
      productId: 'prod-iphone15',
      tenantId: 'tenant-1',
      createdAt: new Date('2026-08-03'),
    },
    {
      id: 'var-512-bl',
      title: '512GB / Blue Titanium',
      sku: 'IP15PM-512-BL',
      productId: 'prod-iphone15',
      tenantId: 'tenant-1',
      createdAt: new Date('2026-08-04'),
    },
  ];

  const mockStocks = [
    {
      id: 'stock-1',
      productId: 'prod-iphone15',
      variantId: 'var-256-nt',
      quantityOnHand: 45,
      quantityReserved: 3,
      reorderPoint: 10,
      tenantId: 'tenant-1',
      warehouse: { name: 'Central Warehouse' },
      warehouseId: 'wh-1',
    },
    {
      id: 'stock-2',
      productId: 'prod-iphone15',
      variantId: 'var-256-bl',
      quantityOnHand: 18,
      quantityReserved: 1,
      reorderPoint: 10,
      tenantId: 'tenant-1',
      warehouse: { name: 'Central Warehouse' },
      warehouseId: 'wh-1',
    },
    {
      id: 'stock-3',
      productId: 'prod-iphone15',
      variantId: 'var-512-nt',
      quantityOnHand: 12,
      quantityReserved: 0,
      reorderPoint: 10,
      tenantId: 'tenant-1',
      warehouse: { name: 'Central Warehouse' },
      warehouseId: 'wh-1',
    },
    {
      id: 'stock-4',
      productId: 'prod-iphone15',
      variantId: 'var-512-bl',
      quantityOnHand: 0,
      quantityReserved: 0,
      reorderPoint: 5,
      tenantId: 'tenant-1',
      warehouse: { name: 'Central Warehouse' },
      warehouseId: 'wh-1',
    },
  ];

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn().mockImplementation((opts) => {
        if (opts.where.id === 'prod-iphone15' && opts.where.tenantId === 'tenant-1') {
          return Promise.resolve(mockProduct);
        }
        return Promise.resolve(null);
      }),
    };

    variantRepo = {
      find: jest.fn().mockResolvedValue(mockVariants),
    };

    stockRepo = {
      find: jest.fn().mockResolvedValue(mockStocks),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductVariantInventoryService,
        InventoryDomainService,
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: getRepositoryToken(ProductVariantEntity), useValue: variantRepo },
        { provide: getRepositoryToken(InventoryStockEntity), useValue: stockRepo },
      ],
    }).compile();

    service = module.get<GetProductVariantInventoryService>(GetProductVariantInventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return variant-level inventory with correct individual metrics and aggregated summary', async () => {
    const result = await service.execute('tenant-1', 'prod-iphone15', { page: 1, limit: 10 });

    expect(result.product.name).toBe('iPhone 15 Pro Max');
    expect(result.product.categoryName).toBe('Mobiles & Tablets');
    expect(result.data).toHaveLength(4);

    // Summary calculation
    // Total On Hand: 45 + 18 + 12 + 0 = 75
    // Total Reserved: 3 + 1 + 0 + 0 = 4
    // Total Available: 42 + 17 + 12 + 0 = 71
    // In Stock: 256-NT (42 > 10), 256-BL (17 > 10), 512-NT (12 > 10) = 3 in stock
    // Out of stock: 512-BL (0 <= 0) = 1 out of stock
    expect(result.summary).toEqual({
      totalVariants: 4,
      totalOnHand: 75,
      totalReserved: 4,
      totalAvailable: 71,
      lowStockVariants: 0,
      outOfStockVariants: 1,
      inStockVariants: 3,
    });

    const blue256 = result.data.find((v) => v.sku === 'IP15PM-256-BL');
    expect(blue256).toBeDefined();
    expect(blue256?.variantTitle).toBe('256GB / Blue Titanium');
    expect(blue256?.quantityOnHand).toBe(18);
    expect(blue256?.quantityReserved).toBe(1);
    expect(blue256?.availableQuantity).toBe(17);
    expect(blue256?.status).toBe(StockStatus.IN_STOCK);

    const natural256 = result.data.find((v) => v.sku === 'IP15PM-256-NT');
    expect(natural256).toBeDefined();
    expect(natural256?.variantTitle).toBe('256GB / Natural Titanium');
    expect(natural256?.quantityOnHand).toBe(45);
    expect(natural256?.quantityReserved).toBe(3);
    expect(natural256?.availableQuantity).toBe(42);
    expect(natural256?.status).toBe(StockStatus.IN_STOCK);

    const blue512 = result.data.find((v) => v.sku === 'IP15PM-512-BL');
    expect(blue512).toBeDefined();
    expect(blue512?.variantTitle).toBe('512GB / Blue Titanium');
    expect(blue512?.quantityOnHand).toBe(0);
    expect(blue512?.availableQuantity).toBe(0);
    expect(blue512?.status).toBe(StockStatus.OUT_OF_STOCK);

  });

  it('should filter variants by search and status', async () => {
    const result = await service.execute('tenant-1', 'prod-iphone15', {
      search: '512GB',
      status: StockStatus.OUT_OF_STOCK,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].variantTitle).toBe('512GB / Blue Titanium');
    expect(result.meta.total).toBe(1);
  });

  it('should throw NotFoundException when product does not exist or belongs to another tenant', async () => {
    await expect(
      service.execute('tenant-intruder', 'prod-iphone15', {}),
    ).rejects.toThrow(NotFoundException);
  });
});
