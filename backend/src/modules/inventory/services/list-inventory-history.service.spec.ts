import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ListInventoryHistoryService } from './list-inventory-history.service';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { MovementType } from '../enums/inventory-movement-type.enum';

describe('ListInventoryHistoryService', () => {
  let service: ListInventoryHistoryService;
  let movementRepo: any;
  let stockRepo: any;
  let qb: any;

  const mockMovements = [
    {
      id: 'mov-1',
      productId: 'prod-100',
      variantId: 'var-100',
      inventoryStockId: 'stock-100',
      type: MovementType.IN,
      quantity: 20,
      previousQuantity: 25,
      newQuantity: 45,
      reason: 'New Stock Received',
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceId: 'PO-1024',
      note: 'Shipment verified',
      createdBy: 'user-admin-1',
      tenantId: 'tenant-1',
      createdAt: new Date('2026-08-14T10:00:00Z'),
      product: {
        id: 'prod-100',
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        sku: 'IP15PRO-BASE',
        images: [{ url: 'https://img.com/iphone.jpg', isPrimary: true, sortOrder: 0 }],
      },
      variant: {
        id: 'var-100',
        title: '256GB / Natural',
        sku: 'IP15PRO-256',
      },
    },
    {
      id: 'mov-2',
      productId: 'prod-100',
      variantId: 'var-100',
      inventoryStockId: 'stock-100',
      type: MovementType.OUT,
      quantity: -5,
      previousQuantity: 30,
      newQuantity: 25,
      reason: 'Damaged Items',
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceId: 'ADJ-001',
      note: 'Water damage in aisle 4',
      createdBy: 'user-admin-2',
      tenantId: 'tenant-1',
      createdAt: new Date('2026-08-13T10:00:00Z'),
      product: {
        id: 'prod-100',
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        sku: 'IP15PRO-BASE',
        images: [{ url: 'https://img.com/iphone.jpg', isPrimary: true, sortOrder: 0 }],
      },
      variant: {
        id: 'var-100',
        title: '256GB / Natural',
        sku: 'IP15PRO-256',
      },
    },
  ];

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([mockMovements, 2]),
    };

    movementRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    stockRepo = {
      findOne: jest.fn().mockImplementation((opts) => {
        if (opts.where.id === 'stock-100' && opts.where.tenantId === 'tenant-1') {
          return Promise.resolve({ id: 'stock-100', tenantId: 'tenant-1' });
        }
        return Promise.resolve(null);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListInventoryHistoryService,
        { provide: getRepositoryToken(InventoryMovementEntity), useValue: movementRepo },
        { provide: getRepositoryToken(InventoryStockEntity), useValue: stockRepo },
      ],
    }).compile();

    service = module.get<ListInventoryHistoryService>(ListInventoryHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return paginated history with formatted data and thumbnails', async () => {
    const result = await service.execute('tenant-1', { page: 1, limit: 10 });

    expect(movementRepo.createQueryBuilder).toHaveBeenCalledWith('movement');
    expect(qb.where).toHaveBeenCalledWith('movement.tenantId = :tenantId', { tenantId: 'tenant-1' });
    expect(result.data.length).toBe(2);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 });

    const first = result.data[0];
    expect(first.id).toBe('mov-1');
    expect(first.type).toBe(MovementType.IN);
    expect(first.quantityDelta).toBe(20);
    expect(first.quantityBefore).toBe(25);
    expect(first.quantityAfter).toBe(45);
    expect(first.product.thumbnail).toBe('https://img.com/iphone.jpg');
    expect(first.variant?.title).toBe('256GB / Natural');
    expect(first.referenceId).toBe('PO-1024');
    expect(first.performedBy).toBe('user-admin-1');
  });

  it('should apply filters for inventoryId, type, search, and date range', async () => {
    await service.execute('tenant-1', {
      inventoryId: 'stock-100',
      type: MovementType.IN,
      search: 'PO-1024',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-14',
    });

    expect(stockRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'stock-100', tenantId: 'tenant-1' },
    });
    expect(qb.andWhere).toHaveBeenCalledWith('movement.inventoryStockId = :targetInventoryId', {
      targetInventoryId: 'stock-100',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('movement.type = :type', {
      type: MovementType.IN,
    });
  });

  it('should throw NotFoundException when specific inventory stock is not found or belongs to another tenant', async () => {
    await expect(
      service.execute('tenant-intruder', {}, 'stock-100'),
    ).rejects.toThrow(NotFoundException);
  });
});
