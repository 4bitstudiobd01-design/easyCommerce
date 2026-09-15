import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryDomainService } from './inventory-domain.service';
import { AdjustStockService } from './adjust-stock.service';
import { BulkAdjustStockService } from './bulk-adjust-stock.service';
import { GetInventorySettingsOverviewService } from './get-inventory-settings-overview.service';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

describe('Inventory Security, Invariants & Edge Cases', () => {
  let domainService: InventoryDomainService;
  let overviewService: GetInventorySettingsOverviewService;

  let productRepo: any;
  let variantRepo: any;
  let stockRepo: any;
  let movementRepo: any;
  let warehouseRepo: any;

  beforeEach(async () => {
    productRepo = {
      count: jest.fn().mockResolvedValue(10),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ id: 'p-' + Math.random(), ...d })),
    };

    variantRepo = {
      count: jest.fn().mockResolvedValue(25),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ id: 'v-' + Math.random(), ...d })),
    };

    stockRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 's-healthy-1',
          quantityOnHand: 50,
          quantityReserved: 5,
          reorderPoint: 10,
          tenantId: 'tenant-1',
          product: { lowStockThreshold: 10, allowBackorder: false },
        },
        {
          id: 's-low-1',
          quantityOnHand: 8,
          quantityReserved: 1,
          reorderPoint: 10,
          tenantId: 'tenant-1',
          product: { lowStockThreshold: 10, allowBackorder: false },
        },
        {
          id: 's-out-1',
          quantityOnHand: 0,
          quantityReserved: 0,
          reorderPoint: 5,
          tenantId: 'tenant-1',
          product: { lowStockThreshold: 5, allowBackorder: false },
        },
      ]),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ id: 's-' + Math.random(), ...d })),
    };

    movementRepo = {
      count: jest.fn().mockResolvedValue(80),
      save: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ id: 'm-' + Math.random(), ...d })),
    };

    warehouseRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'wh-1', name: 'Main Central Warehouse', tenantId: 'tenant-1' }),
      save: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ id: 'wh-' + Math.random(), ...d })),
    };

    const mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const transactionalManager = {
          findOne: jest.fn().mockImplementation((entityClass, opts) => {
            if (entityClass === WarehouseEntity) return Promise.resolve({ id: 'wh-1', name: 'Main Warehouse' });
            return Promise.resolve(null);
          }),
          create: jest.fn().mockImplementation((entityClass, d) => ({ id: 'entity-' + Math.random(), ...d })),
          save: jest.fn().mockImplementation((entityClass, d) => Promise.resolve(d)),
        };
        return await cb(transactionalManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryDomainService,
        GetInventorySettingsOverviewService,
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: getRepositoryToken(ProductVariantEntity), useValue: variantRepo },
        { provide: getRepositoryToken(InventoryStockEntity), useValue: stockRepo },
        { provide: getRepositoryToken(InventoryMovementEntity), useValue: movementRepo },
        { provide: getRepositoryToken(WarehouseEntity), useValue: warehouseRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    domainService = module.get<InventoryDomainService>(InventoryDomainService);
    overviewService = module.get<GetInventorySettingsOverviewService>(GetInventorySettingsOverviewService);
  });

  describe('Negative Stock Protection & Invariant Checks', () => {
    it('should disallow negative on-hand adjustment when backorders are disabled', () => {
      expect(() => {
        domainService.computeAdjustmentNewOnHand({
          currentOnHand: 5,
          adjustmentQuantity: 10,
          action: 'REMOVE',
          allowBackorder: false,
        });
      }).toThrow(BadRequestException);
    });

    it('should correctly compute canonical available stock as onHand - reserved', () => {
      const metrics = domainService.computeStockMetrics({
        onHand: 45,
        reserved: 5,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      });

      expect(metrics.available).toBe(40);
      expect(metrics.status).toBe(StockStatus.IN_STOCK);
    });

    it('should classify item as LOW_STOCK when available <= threshold and available > 0', () => {
      const metrics = domainService.computeStockMetrics({
        onHand: 10,
        reserved: 2,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      });

      expect(metrics.available).toBe(8);
      expect(metrics.status).toBe(StockStatus.LOW_STOCK);
    });

    it('should classify item as OUT_OF_STOCK when available <= 0 even if onHand > 0 due to reserved units', () => {
      const metrics = domainService.computeStockMetrics({
        onHand: 3,
        reserved: 3,
        lowStockThreshold: 10,
        trackInventory: true,
        allowBackorder: false,
      });

      expect(metrics.available).toBe(0);
      expect(metrics.status).toBe(StockStatus.OUT_OF_STOCK);
    });
  });

  describe('Data Overview & Integrity Health Audit', () => {
    it('should return healthy status when all stock records satisfy mathematical invariants', async () => {
      const result = await overviewService.execute('tenant-1');

      expect(result.overview.totalProducts).toBe(10);
      expect(result.overview.totalVariants).toBe(25);
      expect(result.overview.totalInventoryItems).toBe(3);
      expect(result.overview.inStockItems).toBe(1);
      expect(result.overview.lowStockItems).toBe(1);
      expect(result.overview.outOfStockItems).toBe(1);
      expect(result.integrity.status).toBe('HEALTHY');
      expect(result.integrity.violationCount).toBe(0);
      expect(result.securityGuarantees.tenantIsolationEnabled).toBe(true);
      expect(result.securityGuarantees.stockValidationEnabled).toBe(true);
    });

    it('should detect corrupted data violations when reserved exceeds on-hand', async () => {
      stockRepo.find.mockResolvedValue([
        {
          id: 's-corrupted-1',
          quantityOnHand: 5,
          quantityReserved: 12,
          reorderPoint: 10,
          tenantId: 'tenant-1',
          product: { lowStockThreshold: 10, allowBackorder: false },
        },
      ]);

      const result = await overviewService.execute('tenant-1');

      expect(result.integrity.status).toBe('DEGRADED');
      expect(result.integrity.violationCount).toBe(1);
      expect(result.integrity.violations[0].type).toBe('RESERVED_EXCEEDS_ON_HAND');
    });
  });
});
