import { CreateProductService } from '../../catalog/services/create-product.service';
import { ListProductsService } from '../../catalog/services/list-products.service';
import { BadRequestException } from '@nestjs/common';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

describe('Product Inventory, SKU & Stock Management Services', () => {
  describe('SKU and Barcode Uniqueness Validation', () => {
    it('should throw BadRequestException when creating product with duplicate SKU', async () => {
      const productRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 'existing-prod-1', sku: 'TS-BLK-001', tenantId: 'tenant-1' }),
        create: jest.fn().mockImplementation((val) => val),
        save: jest.fn().mockImplementation((val) => ({ id: 'p1', ...val })),
      };
      const variantRepo = { create: jest.fn(), save: jest.fn() };
      const imageRepo = { create: jest.fn(), save: jest.fn() };
      const collectionRepo = { find: jest.fn() };
      const stockRepo = { create: jest.fn(), save: jest.fn() };
      const movementRepo = { create: jest.fn(), save: jest.fn() };
      const warehouseRepo = { findOne: jest.fn().mockResolvedValue({ id: 'wh-1' }), create: jest.fn().mockImplementation((v) => v), save: jest.fn().mockResolvedValue({ id: 'wh-1' }) };
      const slugService = { generateSlug: jest.fn().mockResolvedValue('duplicate-sku') };

      const service = new CreateProductService(
        productRepo as any,
        variantRepo as any,
        imageRepo as any,
        collectionRepo as any,
        stockRepo as any,
        movementRepo as any,
        warehouseRepo as any,
        slugService as any,
      );

      await expect(
        service.execute('tenant-1', {
          name: 'Duplicate SKU Shirt',
          sku: 'TS-BLK-001',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when creating product with duplicate Barcode', async () => {
      const productRepo = {
        findOne: jest.fn().mockImplementation(async ({ where }) => {
          if (where && where.barcode === '8940001234567') {
            return { id: 'existing-prod-2', barcode: '8940001234567', tenantId: 'tenant-1' };
          }
          return null;
        }),
        create: jest.fn().mockImplementation((val) => val),
        save: jest.fn().mockImplementation((val) => ({ id: 'p1', ...val })),
      };
      const variantRepo = { create: jest.fn(), save: jest.fn() };
      const imageRepo = { create: jest.fn(), save: jest.fn() };
      const collectionRepo = { find: jest.fn() };
      const stockRepo = { create: jest.fn(), save: jest.fn() };
      const movementRepo = { create: jest.fn(), save: jest.fn() };
      const warehouseRepo = { findOne: jest.fn().mockResolvedValue({ id: 'wh-1' }), create: jest.fn().mockImplementation((v) => v), save: jest.fn().mockResolvedValue({ id: 'wh-1' }) };
      const slugService = { generateSlug: jest.fn().mockResolvedValue('duplicate-barcode') };

      const service = new CreateProductService(
        productRepo as any,
        variantRepo as any,
        imageRepo as any,
        collectionRepo as any,
        stockRepo as any,
        movementRepo as any,
        warehouseRepo as any,
        slugService as any,
      );

      await expect(
        service.execute('tenant-1', {
          name: 'Duplicate Barcode Shirt',
          barcode: '8940001234567',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Stock Status Derivation in ListProductsService', () => {
    it('should attach stockInfo with derived stockStatus for products', async () => {
      const products = [
        { id: 'p1', name: 'Tracked In Stock', trackInventory: true, allowBackorder: false, lowStockThreshold: 10 },
        { id: 'p2', name: 'Tracked Low Stock', trackInventory: true, allowBackorder: false, lowStockThreshold: 10 },
        { id: 'p3', name: 'Tracked Out of Stock', trackInventory: true, allowBackorder: false, lowStockThreshold: 10 },
        { id: 'p4', name: 'Digital Item', trackInventory: false, allowBackorder: false, lowStockThreshold: 10 },
      ];

      const productRepo = {
        createQueryBuilder: jest.fn().mockReturnValue({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([products, 4]),
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        }),
      };

      const stockRepo = {
        find: jest.fn().mockResolvedValue([
          { productId: 'p1', quantityOnHand: 50, quantityReserved: 5 },
          { productId: 'p2', quantityOnHand: 8, quantityReserved: 0 },
          { productId: 'p3', quantityOnHand: 0, quantityReserved: 0 },
        ]),
      };

      const service = new ListProductsService(productRepo as any, stockRepo as any);
      const result = await service.execute('tenant-1');

      expect((result.data[0] as any).stockInfo.stockStatus).toBe(StockStatus.IN_STOCK);
      expect((result.data[1] as any).stockInfo.stockStatus).toBe(StockStatus.LOW_STOCK);
      expect((result.data[2] as any).stockInfo.stockStatus).toBe(StockStatus.OUT_OF_STOCK);
      expect((result.data[3] as any).stockInfo.stockStatus).toBe(StockStatus.NOT_TRACKED);
    });
  });
});
