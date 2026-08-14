import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdjustStockService } from './adjust-stock.service';
import { InventoryDomainService } from './inventory-domain.service';
import { ListWarehousesService } from './list-warehouses.service';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { StockAdjustmentAction } from '../dto/adjust-stock.dto';
import { StockStatus } from '../../catalog/enums/stock-status.enum';
import { MovementType } from '../enums/inventory-movement-type.enum';

describe('AdjustStockService', () => {
  let service: AdjustStockService;
  let queryRunner: any;
  let dataSource: any;
  let stockRepo: any;
  let movementRepo: any;
  let productRepo: any;
  let warehouseRepo: any;
  let listWarehousesService: any;

  const mockStock = {
    id: 'stock-100',
    productId: 'prod-100',
    warehouseId: 'wh-100',
    quantityOnHand: 45,
    quantityReserved: 3,
    reorderPoint: 10,
    tenantId: 'tenant-1',
    product: {
      id: 'prod-100',
      name: 'iPhone 15 Pro',
      trackInventory: true,
      allowBackorder: false,
      lowStockThreshold: 10,
    },
  };

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn().mockImplementation((entity, opts) => {
          if (entity === InventoryStockEntity) {
            if (opts.where.id === 'stock-100' && opts.where.tenantId === 'tenant-1') {
              return Promise.resolve({ ...mockStock });
            }
            if (opts.where.productId === 'prod-100' && opts.where.tenantId === 'tenant-1') {
              return Promise.resolve({ ...mockStock });
            }
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation((entity, data) => ({
          id: `created-${Date.now()}`,
          ...data,
        })),
        save: jest.fn().mockImplementation((entity, data) => Promise.resolve(data)),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    stockRepo = {};
    movementRepo = {};
    productRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'prod-100',
        name: 'iPhone 15 Pro',
        trackInventory: true,
        allowBackorder: false,
        lowStockThreshold: 10,
      }),
    };
    warehouseRepo = {};
    listWarehousesService = {
      execute: jest.fn().mockResolvedValue([{ id: 'wh-100', name: 'Default Warehouse' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdjustStockService,
        InventoryDomainService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(InventoryStockEntity), useValue: stockRepo },
        { provide: getRepositoryToken(InventoryMovementEntity), useValue: movementRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: getRepositoryToken(WarehouseEntity), useValue: warehouseRepo },
        { provide: ListWarehousesService, useValue: listWarehousesService },
      ],
    }).compile();

    service = module.get<AdjustStockService>(AdjustStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully ADD stock and create an IN movement in atomic transaction', async () => {
    const result = await service.execute(
      'tenant-1',
      {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.ADD,
        quantity: 10,
        reason: 'New Stock Received',
        reference: 'PO-1024',
      },
      'user-admin',
    );

    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(result.before).toEqual({ onHand: 45, reserved: 3, available: 42 });
    expect(result.after).toEqual({ onHand: 55, reserved: 3, available: 52 });
    expect(result.delta).toBe(10);
    expect(result.status).toBe(StockStatus.IN_STOCK);
    expect(result.movement.type).toBe(MovementType.IN);
    expect(result.movement.quantity).toBe(10);
    expect(result.movement.previousQuantity).toBe(45);
    expect(result.movement.newQuantity).toBe(55);
    expect(result.movement.reason).toBe('New Stock Received');
  });

  it('should successfully REMOVE stock and create an OUT movement in atomic transaction', async () => {
    const result = await service.execute(
      'tenant-1',
      {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.REMOVE,
        quantity: 10,
        reason: 'Damaged Stock',
      },
      'user-admin',
    );

    expect(result.before).toEqual({ onHand: 45, reserved: 3, available: 42 });
    expect(result.after).toEqual({ onHand: 35, reserved: 3, available: 32 });
    expect(result.delta).toBe(-10);
    expect(result.movement.type).toBe(MovementType.OUT);
    expect(result.movement.quantity).toBe(-10);
    expect(result.movement.previousQuantity).toBe(45);
    expect(result.movement.newQuantity).toBe(35);
  });

  it('should reject REMOVE when requested quantity exceeds available stock', async () => {
    // Current onHand: 45, reserved: 3 -> available: 42. Attempting to remove 43.
    await expect(
      service.execute('tenant-1', {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.REMOVE,
        quantity: 43,
        reason: 'Bulk Writeoff',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should successfully SET stock to exact quantity', async () => {
    const result = await service.execute(
      'tenant-1',
      {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.SET,
        quantity: 20,
        reason: 'Inventory Audit',
      },
      'user-admin',
    );

    expect(result.before).toEqual({ onHand: 45, reserved: 3, available: 42 });
    expect(result.after).toEqual({ onHand: 20, reserved: 3, available: 17 });
    expect(result.delta).toBe(-25);
    expect(result.movement.previousQuantity).toBe(45);
    expect(result.movement.newQuantity).toBe(20);
  });

  it('should reject SET when requested quantity is less than reserved stock', async () => {
    // Current reserved is 3. Attempting to set to 2.
    await expect(
      service.execute('tenant-1', {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.SET,
        quantity: 2,
        reason: 'Inventory Audit',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should reject non-positive quantities on ADD and REMOVE actions', async () => {
    await expect(
      service.execute('tenant-1', {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.ADD,
        quantity: 0,
        reason: 'Test',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.execute('tenant-1', {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.REMOVE,
        quantity: -5,
        reason: 'Test',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject empty reasons', async () => {
    await expect(
      service.execute('tenant-1', {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.ADD,
        quantity: 5,
        reason: '   ',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should enforce tenant isolation and throw NotFoundException on unauthorized tenant access', async () => {
    await expect(
      service.execute('tenant-intruder', {
        inventoryId: 'stock-100',
        action: StockAdjustmentAction.ADD,
        quantity: 5,
        reason: 'Hack attempt',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
