import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListInventoryService } from './list-inventory.service';
import { InventoryDomainService } from './inventory-domain.service';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { BranchStockEntity } from '../entities/branch-stock.entity';
import { StockStatus } from '../../catalog/enums/stock-status.enum';
import { ProductType } from '../../catalog/enums/product-type.enum';
import { InventorySortField } from '../dto/list-inventory-query.dto';

describe('ListInventoryService', () => {
  let service: ListInventoryService;
  let stockRepo: any;
  let qb: any;

  beforeEach(async () => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'stock-1',
            productId: 'prod-1',
            warehouseId: 'wh-1',
            quantityOnHand: 50,
            quantityReserved: 5,
            reorderPoint: 10,
            tenantId: 'tenant-1',
            updatedAt: new Date('2026-08-14T10:00:00Z'),
            product: {
              id: 'prod-1',
              name: 'iPhone 15 Pro',
              slug: 'iphone-15-pro',
              sku: 'IP15P-128',
              productType: ProductType.PHYSICAL,
              trackInventory: true,
              allowBackorder: false,
              lowStockThreshold: 10,
              category: { name: 'Smartphones' },
              images: [{ url: 'https://img.com/iphone.jpg', isPrimary: true, sortOrder: 0 }],
            },
            variant: {
              id: 'var-1',
              title: '128GB / Black Titanium',
              sku: 'IP15P-128-BLK',
            },
            warehouse: {
              id: 'wh-1',
              name: 'Central Warehouse',
            },
          },
        ],
        1,
      ]),
    };

    stockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const branchStockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListInventoryService,
        InventoryDomainService,
        {
          provide: getRepositoryToken(InventoryStockEntity),
          useValue: stockRepo,
        },
        {
          provide: getRepositoryToken(BranchStockEntity),
          useValue: branchStockRepo,
        },
      ],
    }).compile();

    service = module.get<ListInventoryService>(ListInventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list inventory with server-side pagination, search, and calculate canonical metrics', async () => {
    const result = await service.execute('tenant-1', {
      page: 1,
      limit: 10,
      search: 'iphone',
      status: StockStatus.IN_STOCK,
    });

    expect(qb.where).toHaveBeenCalledWith('stock.tenantId = :tenantId', { tenantId: 'tenant-1' });
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(product.name ILIKE :search OR product.sku ILIKE :search OR variant.sku ILIKE :search OR variant.title ILIKE :search)',
      { search: '%iphone%' },
    );
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    const item = result.data[0];
    expect(item.productName).toBe('iPhone 15 Pro');
    expect(item.variantTitle).toBe('128GB / Black Titanium');
    expect(item.sku).toBe('IP15P-128-BLK');
    expect(item.quantityOnHand).toBe(50);
    expect(item.quantityReserved).toBe(5);
    expect(item.availableQuantity).toBe(45);
    expect(item.status).toBe(StockStatus.IN_STOCK);
    expect(item.productThumbnail).toBe('https://img.com/iphone.jpg');
  });

  it('excludes the variant-product placeholder row and archived products from every query', async () => {
    await service.execute('tenant-1', { page: 1, limit: 10 });

    expect(qb.andWhere).toHaveBeenCalledWith('NOT (product.hasVariants = true AND stock.variantId IS NULL)');
    expect(qb.andWhere).toHaveBeenCalledWith('product.status != :archivedStatus', {
      archivedStatus: 'ARCHIVED',
    });
  });

  it('should filter by LOW_STOCK status using canonical available and threshold bounds', async () => {
    await service.execute('tenant-1', {
      status: StockStatus.LOW_STOCK,
      sortBy: InventorySortField.AVAILABLE,
      sortOrder: 'ASC',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('product.trackInventory = true');
    expect(qb.andWhere).toHaveBeenCalledWith('(stock."quantityOnHand" - stock."quantityReserved") > 0');
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(stock."quantityOnHand" - stock."quantityReserved") <= COALESCE(stock."reorderPoint", product."lowStockThreshold", 10)',
    );
    expect(qb.addSelect).toHaveBeenCalledWith(
      '(stock.quantityOnHand - stock.quantityReserved)',
      'available_quantity_sort',
    );
    expect(qb.orderBy).toHaveBeenCalledWith('available_quantity_sort', 'ASC');
  });

  it('should filter by OUT_OF_STOCK status when available stock <= 0', async () => {
    await service.execute('tenant-1', {
      status: StockStatus.OUT_OF_STOCK,
    });

    expect(qb.andWhere).toHaveBeenCalledWith('product.trackInventory = true');
    expect(qb.andWhere).toHaveBeenCalledWith('(stock."quantityOnHand" - stock."quantityReserved") <= 0');
  });

  it('should filter by NOT_TRACKED status when trackInventory is false', async () => {
    await service.execute('tenant-1', {
      status: StockStatus.NOT_TRACKED,
    });

    expect(qb.andWhere).toHaveBeenCalledWith('product.trackInventory = false');
  });

  it('should filter by category and product type when specified', async () => {
    await service.execute('tenant-1', {
      categoryId: 'cat-phones',
      productType: ProductType.PHYSICAL,
    });

    expect(qb.andWhere).toHaveBeenCalledWith('product.categoryId = :categoryId', {
      categoryId: 'cat-phones',
    });
    expect(qb.andWhere).toHaveBeenCalledWith('product.productType = :productType', {
      productType: ProductType.PHYSICAL,
    });
  });

  describe('branch scope', () => {
    it('queries BranchStockEntity instead of InventoryStockEntity when branchId is given', async () => {
      const branchQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'bstock-1',
              productId: 'prod-1',
              branchId: 'branch-1',
              quantityOnHand: 20,
              quantityReserved: 2,
              reorderPoint: 5,
              tenantId: 'tenant-1',
              updatedAt: new Date('2026-08-14T10:00:00Z'),
              product: {
                id: 'prod-1',
                name: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                sku: 'IP15P-128',
                productType: ProductType.PHYSICAL,
                trackInventory: true,
                allowBackorder: false,
                lowStockThreshold: 10,
              },
            },
          ],
          1,
        ]),
      };
      const branchStockRepo = (service as any).branchStockRepository;
      branchStockRepo.createQueryBuilder = jest.fn().mockReturnValue(branchQb);

      const result = await service.execute('tenant-1', { branchId: 'branch-1' });

      expect(branchStockRepo.createQueryBuilder).toHaveBeenCalledWith('stock');
      expect(branchQb.where).toHaveBeenCalledWith('stock.tenantId = :tenantId', { tenantId: 'tenant-1' });
      expect(branchQb.andWhere).toHaveBeenCalledWith('stock.branchId = :branchId', { branchId: 'branch-1' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].branchId).toBe('branch-1');
      expect(result.data[0].warehouseId).toBeUndefined();
      expect(result.data[0].quantityOnHand).toBe(20);
    });
  });
});
