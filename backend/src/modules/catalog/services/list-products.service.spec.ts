import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListProductsService } from './list-products.service';
import { ProductEntity } from '../entities/product.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';

describe('ListProductsService', () => {
  let service: ListProductsService;
  let productRepo: any;
  let stockRepo: any;
  let queryBuilder: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          { id: 'p1', name: 'Cotton Shirt', slug: 'cotton-shirt', status: ProductStatus.DRAFT, productType: ProductType.PHYSICAL, tenantId: mockTenantId },
          { id: 'p2', name: 'Digital Guide', slug: 'digital-guide', status: ProductStatus.ACTIVE, productType: ProductType.DIGITAL, tenantId: mockTenantId },
        ],
        2,
      ]),
      getRawMany: jest.fn().mockResolvedValue([
        { status: ProductStatus.DRAFT, count: '1' },
        { status: ProductStatus.ACTIVE, count: '1' },
      ]),
    };

    productRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    stockRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListProductsService,
        {
          provide: getRepositoryToken(ProductEntity),
          useValue: productRepo,
        },
        {
          provide: getRepositoryToken(InventoryStockEntity),
          useValue: stockRepo,
        },
      ],
    }).compile();

    service = module.get<ListProductsService>(ListProductsService);
  });

  it('should return paginated products with metadata and status counts for tenant', async () => {
    const result = await service.execute(mockTenantId, { page: 1, limit: 20 });

    expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('p');
    expect(queryBuilder.where).toHaveBeenCalledWith('p.tenantId = :tenantId', { tenantId: mockTenantId });
    expect(result.data).toHaveLength(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
    expect(result.meta.total).toBe(2);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.statusCounts.ALL).toBe(2);
    expect(result.meta.statusCounts.DRAFT).toBe(1);
    expect(result.meta.statusCounts.ACTIVE).toBe(1);
  });

  it('should apply server-side search filter on name, slug, sku, and barcode', async () => {
    await service.execute(mockTenantId, { search: 'shirt' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(p.name ILIKE :s OR p.slug ILIKE :s OR p.sku ILIKE :s OR p.barcode ILIKE :s)',
      { s: '%shirt%' },
    );
  });

  it('should apply status filter when status parameter is provided', async () => {
    await service.execute(mockTenantId, { status: ProductStatus.DRAFT });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'p.status = :status',
      { status: ProductStatus.DRAFT },
    );
  });

  it('should apply productType filter when productType parameter is provided', async () => {
    await service.execute(mockTenantId, { productType: ProductType.DIGITAL });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'p.productType = :productType',
      { productType: ProductType.DIGITAL },
    );
  });

  it('should apply combined search, status, and productType filters', async () => {
    await service.execute(mockTenantId, {
      search: 'shirt',
      status: ProductStatus.ACTIVE,
      productType: ProductType.PHYSICAL,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith('(p.name ILIKE :s OR p.slug ILIKE :s OR p.sku ILIKE :s OR p.barcode ILIKE :s)', { s: '%shirt%' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.status = :status', { status: ProductStatus.ACTIVE });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('p.productType = :productType', { productType: ProductType.PHYSICAL });
  });

  it('should apply whitelisted sorting order', async () => {
    await service.execute(mockTenantId, { sortBy: 'name', sortOrder: 'ASC' });

    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('p.name', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('p.id', 'ASC');
  });

  it('should enforce safe pagination boundaries', async () => {
    await service.execute(mockTenantId, { page: 2, limit: 15 });

    expect(queryBuilder.skip).toHaveBeenCalledWith(15);
    expect(queryBuilder.take).toHaveBeenCalledWith(15);
  });
});
