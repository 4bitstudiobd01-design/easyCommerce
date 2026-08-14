import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListProductsService } from './list-products.service';
import { ImportProductsService } from './import-products.service';
import { CreateProductService } from './create-product.service';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductImageEntity } from '../entities/product-image.entity';
import { CollectionEntity } from '../entities/collection.entity';
import { CategoryEntity } from '../entities/category.entity';
import { BrandEntity } from '../entities/brand.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../inventory/entities/inventory-movement.entity';
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';
import { ProductSlugService } from './product-slug.service';
import { ProductListDto } from '../dto/product-list.dto';
import { StockStatus } from '../enums/stock-status.enum';

/**
 * Regression coverage for defects found during the Product module (Chunks 1-14) audit.
 * Each block documents the original broken behaviour so the fix cannot silently regress.
 */
describe('Product module audit regressions', () => {
  describe('ListProductsService — multi-warehouse stock aggregation', () => {
    // Stock is stored one row per warehouse. The previous implementation built its
    // lookup with map.set(productId, row), so only the LAST warehouse row survived and
    // a product stocked in several warehouses reported a fraction of its real quantity
    // (and could be labelled OUT_OF_STOCK while holding stock elsewhere).
    const buildService = (stockRows: any[]) => {
      const queryBuilder: any = {
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
          [{ id: 'p1', name: 'Multi WH', trackInventory: true, lowStockThreshold: 10, allowBackorder: false }],
          1,
        ]),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      const productRepo = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
      const stockRepo = { find: jest.fn().mockResolvedValue(stockRows) };
      return {
        service: new ListProductsService(productRepo as any, stockRepo as any),
        queryBuilder,
      };
    };

    it('sums quantities across every warehouse row for a product', async () => {
      const { service } = buildService([
        { productId: 'p1', quantityOnHand: 20, quantityReserved: 2 },
        { productId: 'p1', quantityOnHand: 18, quantityReserved: 3 },
        { productId: 'p1', quantityOnHand: 10, quantityReserved: 0 },
      ]);

      const result = await service.execute('tenant-1', new ProductListDto());
      const stockInfo = (result.data[0] as any).stockInfo;

      expect(stockInfo.onHand).toBe(48);
      expect(stockInfo.reserved).toBe(5);
      expect(stockInfo.available).toBe(43);
      expect(stockInfo.stockStatus).toBe(StockStatus.IN_STOCK);
    });

    it('does not report a multi-warehouse product as out of stock', async () => {
      const { service } = buildService([
        { productId: 'p1', quantityOnHand: 0, quantityReserved: 0 },
        { productId: 'p1', quantityOnHand: 40, quantityReserved: 0 },
      ]);

      const result = await service.execute('tenant-1', new ProductListDto());
      expect((result.data[0] as any).stockInfo.stockStatus).not.toBe(StockStatus.OUT_OF_STOCK);
      expect((result.data[0] as any).stockInfo.onHand).toBe(40);
    });

    it('never puts a joined column in ORDER BY on the paginated query', async () => {
      // skip/take makes TypeORM build a DISTINCT id subquery and every ORDER BY term is
      // copied into it. Including images.isPrimary there corrupted the page AND the
      // count: a tenant with 34 products returned 4 rows and reported total: 4.
      const { service, queryBuilder } = buildService([]);
      const dto = new ProductListDto();
      dto.sortBy = 'name';
      dto.sortOrder = 'ASC';

      await service.execute('tenant-1', dto);

      const orderedFields = queryBuilder.addOrderBy.mock.calls.map((c: any[]) => String(c[0]));
      expect(orderedFields[0]).toBe('p.name');
      expect(orderedFields.every((f) => f.startsWith('p.'))).toBe(true);
    });

    it('returns the primary image first without ordering by it in SQL', async () => {
      const productRow: any = {
        id: 'p1',
        name: 'With images',
        trackInventory: true,
        lowStockThreshold: 10,
        allowBackorder: false,
        images: [
          { id: 'i1', isPrimary: false, sortOrder: 2 },
          { id: 'i2', isPrimary: true, sortOrder: 5 },
          { id: 'i3', isPrimary: false, sortOrder: 1 },
        ],
      };
      const { service, queryBuilder } = buildService([]);
      queryBuilder.getManyAndCount.mockResolvedValue([[productRow], 1]);

      const result = await service.execute('tenant-1', new ProductListDto());

      expect(result.data[0].images.map((i: any) => i.id)).toEqual(['i2', 'i3', 'i1']);
    });

    it('applies the stockStatus filter in SQL instead of ignoring it', async () => {
      // The DTO accepted stockStatus and the UI sent it, but no service ever used it,
      // so the filter silently returned unfiltered results.
      const { service, queryBuilder } = buildService([]);
      const dto = new ProductListDto();
      dto.stockStatus = StockStatus.OUT_OF_STOCK;

      await service.execute('tenant-1', dto);

      const clauses = queryBuilder.andWhere.mock.calls.map((c: any[]) => String(c[0]));
      expect(clauses.some((c) => c.includes('inventory_stocks'))).toBe(true);
      expect(clauses.some((c) => c.includes('p.trackInventory = true'))).toBe(true);
    });
  });

  describe('ImportProductsService — RFC 4180 CSV parsing', () => {
    const service = () =>
      new ImportProductsService(null as any, null as any, null as any, null as any, null as any, null as any);

    it('keeps a quoted field containing a newline as one field', () => {
      // Splitting on newlines before parsing quotes tore this record into two corrupt
      // rows, importing a product named "Multi" plus a junk row.
      const rows = service().parseCsvRows('name,sku\n"Multi\nLine Product",SKU-1');

      expect(rows).toHaveLength(2);
      expect(rows[1][0]).toBe('Multi\nLine Product');
      expect(rows[1][1]).toBe('SKU-1');
    });

    it('preserves quoted commas, escaped quotes, Bangla text and CRLF endings', () => {
      const rows = service().parseCsvRows('name,sku\r\n"Shirt, Red",S1\r\n"He said ""hi""",S2\r\nসুতির শার্ট,S3');

      expect(rows[1][0]).toBe('Shirt, Red');
      expect(rows[2][0]).toBe('He said "hi"');
      expect(rows[3][0]).toBe('সুতির শার্ট');
    });

    it('keeps empty values positional and drops fully blank lines', () => {
      const rows = service().parseCsvRows('name,sku,barcode\nA,,123\n\n');

      expect(rows).toHaveLength(2);
      expect(rows[1]).toEqual(['A', '', '123']);
    });
  });

  describe('ImportProductsService — import integrity', () => {
    const buildImportService = () => {
      const saved: any[] = [];
      const productRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((dto) => ({ id: `p-${saved.length + 1}`, ...dto })),
        save: jest.fn().mockImplementation((e) => {
          saved.push(e);
          return Promise.resolve(e);
        }),
      };
      const stockRepo = {
        create: jest.fn().mockImplementation((dto) => dto),
        save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      };
      const warehouseRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 'wh-1' }),
        create: jest.fn().mockImplementation((v) => v),
        save: jest.fn().mockResolvedValue({ id: 'wh-1' }),
      };
      const slugService = { generateSlug: jest.fn().mockResolvedValue('slug') };
      const service = new ImportProductsService(
        productRepo as any,
        { findOne: jest.fn().mockResolvedValue(null) } as any,
        { findOne: jest.fn().mockResolvedValue(null) } as any,
        stockRepo as any,
        warehouseRepo as any,
        slugService as any,
      );
      return { service, stockRepo, warehouseRepo };
    };

    it('attaches created stock to a warehouse (warehouseId is NOT NULL)', async () => {
      // Import previously created inventory_stocks without warehouseId, so every CSV
      // import of a new product aborted on a not-null violation.
      const { service, stockRepo } = buildImportService();

      const result = await service.execute('tenant-1', {
        csvContent: 'name,sku,basePrice\nImported,SKU-1,100',
      });

      expect(result.createdCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(stockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ warehouseId: 'wh-1' }));
    });

    it('rejects a SKU repeated within the same file instead of failing the request', async () => {
      // Per-row DB lookups cannot see rows created earlier in the same import, so the
      // second occurrence hit the unique index as an unhandled 500.
      const { service } = buildImportService();

      const result = await service.execute('tenant-1', {
        csvContent: 'name,sku,basePrice\nFirst,DUP-1,100\nSecond,DUP-1,200',
      });

      expect(result.createdCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.failures[0].row).toBe(3);
      expect(result.failures[0].reason).toContain('more than once');
    });

    it('reports a failing row and still imports the remaining rows', async () => {
      const { service } = buildImportService();

      const result = await service.execute('tenant-1', {
        csvContent: 'name,sku,basePrice\nGood,SKU-1,100\nBad,SKU-2,notanumber\nAlsoGood,SKU-3,300',
      });

      expect(result.createdCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.failures[0].sku).toBe('SKU-2');
    });
  });

  describe('CreateProductService — inventory bootstrap', () => {
    const buildModule = async (warehouseRepo: any) => {
      const stockRepo = {
        create: jest.fn().mockImplementation((dto) => ({ id: 'stock-1', ...dto })),
        save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CreateProductService,
          {
            provide: getRepositoryToken(ProductEntity),
            useValue: {
              create: jest.fn().mockImplementation((dto) => ({ id: 'prod-1', ...dto })),
              save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
              findOne: jest.fn().mockResolvedValue(null),
            },
          },
          {
            provide: getRepositoryToken(CategoryEntity),
            useValue: { findOne: jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Mock Cat' }) },
          },
          {
            provide: getRepositoryToken(ProductVariantEntity),
            useValue: { create: jest.fn().mockImplementation((d) => d), save: jest.fn() },
          },
          {
            provide: getRepositoryToken(ProductImageEntity),
            useValue: { create: jest.fn().mockImplementation((d) => d), save: jest.fn() },
          },
          { provide: getRepositoryToken(CollectionEntity), useValue: { find: jest.fn().mockResolvedValue([]) } },
          { provide: getRepositoryToken(InventoryStockEntity), useValue: stockRepo },
          {
            provide: getRepositoryToken(InventoryMovementEntity),
            useValue: { create: jest.fn().mockImplementation((d) => d), save: jest.fn() },
          },
          { provide: getRepositoryToken(WarehouseEntity), useValue: warehouseRepo },
          { provide: ProductSlugService, useValue: { generateSlug: jest.fn().mockResolvedValue('a-product') } },
        ],
      }).compile();

      return { service: module.get(CreateProductService), stockRepo };
    };

    it('links the initial stock row to the tenant default warehouse', async () => {
      // inventory_stocks.warehouseId is NOT NULL; omitting it made EVERY product
      // creation fail with a raw constraint error.
      const warehouseRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 'wh-default' }),
        create: jest.fn(),
        save: jest.fn(),
      };
      const { service, stockRepo } = await buildModule(warehouseRepo);

      await service.execute('tenant-1', { name: 'A Product', basePrice: 500, initialStock: 7 } as any);

      expect(stockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ warehouseId: 'wh-default', quantityOnHand: 7 }),
      );
    });

    it('provisions a default warehouse when the tenant has none yet', async () => {
      const warehouseRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((v) => v),
        save: jest.fn().mockResolvedValue({ id: 'wh-new' }),
      };
      const { service, stockRepo } = await buildModule(warehouseRepo);

      await service.execute('tenant-1', { name: 'A Product', basePrice: 500 } as any);

      expect(warehouseRepo.save).toHaveBeenCalled();
      expect(stockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ warehouseId: 'wh-new' }));
    });
  });
});
