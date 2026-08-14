import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BulkAdjustStockService } from './bulk-adjust-stock.service';
import { InventoryDomainService } from './inventory-domain.service';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { MovementType } from '../enums/inventory-movement-type.enum';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

describe('BulkAdjustStockService', () => {
  let service: BulkAdjustStockService;
  let dataSource: any;
  let transactionalEntityManager: any;
  let qb: any;

  const mockStocks = [
    {
      id: 'stock-1',
      productId: 'prod-1',
      variantId: 'var-1',
      quantityOnHand: 20,
      quantityReserved: 2,
      reorderPoint: 10,
      tenantId: 'tenant-1',
      product: { id: 'prod-1', name: 'Item 1', trackInventory: true, allowBackorder: false, lowStockThreshold: 10 },
      variant: { id: 'var-1', title: 'Variant 1' },
    },
    {
      id: 'stock-2',
      productId: 'prod-2',
      variantId: null,
      quantityOnHand: 35,
      quantityReserved: 5,
      reorderPoint: 10,
      tenantId: 'tenant-1',
      product: { id: 'prod-2', name: 'Item 2', trackInventory: true, allowBackorder: false, lowStockThreshold: 10 },
      variant: null,
    },
    {
      id: 'stock-3',
      productId: 'prod-3',
      variantId: null,
      quantityOnHand: 10,
      quantityReserved: 0,
      reorderPoint: 5,
      tenantId: 'tenant-1',
      product: { id: 'prod-3', name: 'Item 3', trackInventory: true, allowBackorder: false, lowStockThreshold: 5 },
      variant: null,
    },
  ];

  let requestedIds: string[] = [];

  beforeEach(async () => {
    qb = {
      setLock: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockImplementation((clause, params) => {
        if (params && params.ids) {
          requestedIds = params.ids;
        }
        return qb;
      }),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockImplementation(() => {
        const filtered = mockStocks.filter((s) => requestedIds.includes(s.id));
        return Promise.resolve(JSON.parse(JSON.stringify(filtered)));
      }),
    };


    transactionalEntityManager = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      save: jest.fn().mockImplementation((entityClass, entity) => {
        if (entityClass === InventoryMovementEntity || entity instanceof InventoryMovementEntity || entity.type) {
          return Promise.resolve({ id: 'mov-' + Math.random().toString(36).substring(7), ...entity });
        }
        return Promise.resolve(entity);
      }),
      create: jest.fn().mockImplementation((entityClass, data) => ({
        id: 'mov-' + Math.random().toString(36).substring(7),
        ...data,
      })),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return await cb(transactionalEntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkAdjustStockService,
        InventoryDomainService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<BulkAdjustStockService>(BulkAdjustStockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should bulk ADD stock to all selected items and create individual movement records', async () => {
    const result = await service.execute(
      'tenant-1',
      {
        inventoryIds: ['stock-1', 'stock-2', 'stock-3'],
        action: 'ADD',
        quantity: 10,
        reason: 'Shipment Restock',
      },
      'admin-user-1',
    );

    expect(result.success).toBe(true);
    expect(result.affectedCount).toBe(3);
    expect(result.movementCount).toBe(3);

    // Stock 1: 20 + 10 = 30
    const item1 = result.items.find((i) => i.inventoryId === 'stock-1');
    expect(item1?.previousQuantity).toBe(20);
    expect(item1?.quantityDelta).toBe(10);
    expect(item1?.newQuantity).toBe(30);
    expect(item1?.availableQuantity).toBe(28); // 30 - 2 reserved
    expect(item1?.status).toBe(StockStatus.IN_STOCK);

    // Stock 2: 35 + 10 = 45
    const item2 = result.items.find((i) => i.inventoryId === 'stock-2');
    expect(item2?.previousQuantity).toBe(35);
    expect(item2?.quantityDelta).toBe(10);
    expect(item2?.newQuantity).toBe(45);

    // Stock 3: 10 + 10 = 20
    const item3 = result.items.find((i) => i.inventoryId === 'stock-3');
    expect(item3?.previousQuantity).toBe(10);
    expect(item3?.quantityDelta).toBe(10);
    expect(item3?.newQuantity).toBe(20);
  });

  it('should bulk REMOVE stock from selected items', async () => {
    const result = await service.execute(
      'tenant-1',
      {
        inventoryIds: ['stock-1', 'stock-2'],
        action: 'REMOVE',
        quantity: 5,
        reason: 'Damaged Goods',
      },
      'admin-user-1',
    );

    expect(result.success).toBe(true);
    const item1 = result.items.find((i) => i.inventoryId === 'stock-1');
    expect(item1?.previousQuantity).toBe(20);
    expect(item1?.quantityDelta).toBe(-5);
    expect(item1?.newQuantity).toBe(15);
  });

  it('should bulk SET stock to a fixed target and calculate individual deltas per item', async () => {
    const result = await service.execute(
      'tenant-1',
      {
        inventoryIds: ['stock-1', 'stock-2', 'stock-3'],
        action: 'SET',
        quantity: 15,
        reason: 'Cycle Count',
      },
      'admin-user-1',
    );

    expect(result.success).toBe(true);

    // Stock 1: was 20 -> set 15 (delta -5)
    const item1 = result.items.find((i) => i.inventoryId === 'stock-1');
    expect(item1?.previousQuantity).toBe(20);
    expect(item1?.quantityDelta).toBe(-5);
    expect(item1?.newQuantity).toBe(15);

    // Stock 2: was 35 -> set 15 (delta -20)
    const item2 = result.items.find((i) => i.inventoryId === 'stock-2');
    expect(item2?.previousQuantity).toBe(35);
    expect(item2?.quantityDelta).toBe(-20);
    expect(item2?.newQuantity).toBe(15);

    // Stock 3: was 10 -> set 15 (delta +5)
    const item3 = result.items.find((i) => i.inventoryId === 'stock-3');
    expect(item3?.previousQuantity).toBe(10);
    expect(item3?.quantityDelta).toBe(5);
    expect(item3?.newQuantity).toBe(15);
  });

  it('should reject REMOVE when requested quantity exceeds available sellable stock', async () => {
    // Stock 1 has onHand=20, reserved=2 -> available=18. Attempting to remove 19 should fail.
    await expect(
      service.execute('tenant-1', {
        inventoryIds: ['stock-1'],
        action: 'REMOVE',
        quantity: 19,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject operation if any selected ID does not belong to tenant', async () => {
    qb.getMany.mockResolvedValue([mockStocks[0]]); // only found 1 out of 2

    await expect(
      service.execute('tenant-1', {
        inventoryIds: ['stock-1', 'stock-foreign'],
        action: 'ADD',
        quantity: 5,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
