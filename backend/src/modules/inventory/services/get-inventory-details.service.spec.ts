import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetInventoryDetailsService } from './get-inventory-details.service';
import { InventoryDomainService } from './inventory-domain.service';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { StockStatus } from '../../catalog/enums/stock-status.enum';
import { ProductType } from '../../catalog/enums/product-type.enum';

describe('GetInventoryDetailsService', () => {
  let service: GetInventoryDetailsService;
  let stockRepo: any;

  const mockStock = {
    id: 'stock-100',
    productId: 'prod-100',
    warehouseId: 'wh-100',
    quantityOnHand: 45,
    quantityReserved: 3,
    reorderPoint: 10,
    tenantId: 'tenant-alpha',
    createdAt: new Date('2026-08-10T10:00:00Z'),
    updatedAt: new Date('2026-08-14T12:00:00Z'),
    product: {
      id: 'prod-100',
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      sku: 'IP15PRO-BASE',
      productType: ProductType.PHYSICAL,
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 10,
      category: {
        id: 'cat-phones',
        name: 'Mobile Phones',
        slug: 'mobile-phones',
      },
      images: [
        { url: 'https://img.com/iphone-front.jpg', isPrimary: true, sortOrder: 0 },
        { url: 'https://img.com/iphone-back.jpg', isPrimary: false, sortOrder: 1 },
      ],
    },
    variant: {
      id: 'var-100',
      title: '256GB / Natural Titanium',
      sku: 'IP15PRO-256-NAT',
      price: 1199.99,
      combinationKey: 'storage:256gb_color:natural',
    },
    warehouse: {
      id: 'wh-100',
      name: 'Central Dhaka Warehouse',
      code: 'DHK-CENTRAL',
      address: 'Plot 12, Tejgaon I/A, Dhaka',
      phone: '+8801700000000',
      isDefault: true,
    },
  };

  beforeEach(async () => {
    stockRepo = {
      findOne: jest.fn().mockImplementation((opts) => {
        if (opts.where.id === 'stock-100' && opts.where.tenantId === 'tenant-alpha') {
          return Promise.resolve(mockStock);
        }
        return Promise.resolve(null);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInventoryDetailsService,
        InventoryDomainService,
        {
          provide: getRepositoryToken(InventoryStockEntity),
          useValue: stockRepo,
        },
      ],
    }).compile();

    service = module.get<GetInventoryDetailsService>(GetInventoryDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return complete inventory details with canonical domain metrics for valid tenant stock', async () => {
    const details = await service.execute('tenant-alpha', 'stock-100');

    expect(stockRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'stock-100', tenantId: 'tenant-alpha' },
      relations: [
        'product',
        'product.images',
        'product.category',
        'variant',
        'warehouse',
      ],
    });

    expect(details.id).toBe('stock-100');
    expect(details.productId).toBe('prod-100');
    expect(details.product.name).toBe('iPhone 15 Pro');
    expect(details.product.thumbnail).toBe('https://img.com/iphone-front.jpg');
    expect(details.product.category?.name).toBe('Mobile Phones');
    expect(details.variant?.title).toBe('256GB / Natural Titanium');
    expect(details.variant?.sku).toBe('IP15PRO-256-NAT');
    expect(details.warehouse.name).toBe('Central Dhaka Warehouse');
    expect(details.quantityOnHand).toBe(45);
    expect(details.quantityReserved).toBe(3);
    expect(details.availableQuantity).toBe(42);
    expect(details.lowStockThreshold).toBe(10);
    expect(details.status).toBe(StockStatus.IN_STOCK);
  });

  it('should throw NotFoundException if stock ID does not exist', async () => {
    await expect(service.execute('tenant-alpha', 'non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should enforce strict tenant isolation and throw NotFoundException if requested by another tenant', async () => {
    await expect(service.execute('tenant-intruder', 'stock-100')).rejects.toThrow(
      NotFoundException,
    );
  });
});
