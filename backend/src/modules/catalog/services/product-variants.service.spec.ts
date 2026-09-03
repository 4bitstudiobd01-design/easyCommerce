import { GenerateProductVariantsService } from './generate-product-variants.service';
import { FindPublicStoreProductsService } from './find-public-store-products.service';
import { BadRequestException } from '@nestjs/common';

describe('Product Variants Services (Chunk 9)', () => {
  describe('GenerateProductVariantsService', () => {
    it('should throw BadRequestException if any selected attribute has isVariantOption=false', async () => {
      const productRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 'prod-1', tenantId: 'tenant-1', basePrice: 1000 }),
      };
      const variantRepo = { find: jest.fn().mockResolvedValue([]) };
      const attributeRepo = {
        find: jest.fn().mockResolvedValue([
          { id: 'attr-1', name: 'Material', isVariantOption: false, sortOrder: 1 },
        ]),
      };
      const optionRepo = { find: jest.fn() };
      const stockRepo = { find: jest.fn() };
      const dataSource = { createQueryRunner: jest.fn() };

      const service = new GenerateProductVariantsService(
        productRepo as any,
        variantRepo as any,
        attributeRepo as any,
        optionRepo as any,
        stockRepo as any,
        dataSource as any,
      );

      await expect(
        service.execute('prod-1', 'tenant-1', {
          dimensions: [{ attributeId: 'attr-1', optionIds: ['opt-1'] }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if generated combinations exceed the safety limit', async () => {
      const productRepo = {
        findOne: jest.fn().mockResolvedValue({ id: 'prod-1', tenantId: 'tenant-1', basePrice: 1000 }),
      };
      const variantRepo = { find: jest.fn().mockResolvedValue([]) };
      const attributeRepo = {
        find: jest.fn().mockResolvedValue([
          { id: 'attr-1', name: 'Option1', key: 'opt1', isVariantOption: true, sortOrder: 1 },
          { id: 'attr-2', name: 'Option2', key: 'opt2', isVariantOption: true, sortOrder: 2 },
        ]),
      };

      // 15 options for each attribute -> 15 * 15 = 225 combinations (> 200 limit)
      const options1 = Array.from({ length: 15 }, (_, i) => ({ id: `o1-${i}`, value: `V1-${i}`, label: `L1-${i}` }));
      const options2 = Array.from({ length: 15 }, (_, i) => ({ id: `o2-${i}`, value: `V2-${i}`, label: `L2-${i}` }));

      const optionRepo = {
        find: jest.fn().mockImplementation(({ where }) => {
          if (where.attributeId === 'attr-1') return Promise.resolve(options1);
          return Promise.resolve(options2);
        }),
      };
      const stockRepo = { find: jest.fn() };
      const dataSource = { createQueryRunner: jest.fn() };

      const service = new GenerateProductVariantsService(
        productRepo as any,
        variantRepo as any,
        attributeRepo as any,
        optionRepo as any,
        stockRepo as any,
        dataSource as any,
      );

      await expect(
        service.execute('prod-1', 'tenant-1', {
          dimensions: [
            { attributeId: 'attr-1', optionIds: options1.map((o) => o.id) },
            { attributeId: 'attr-2', optionIds: options2.map((o) => o.id) },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('FindPublicStoreProductsService - Variant Cost Price Protection', () => {
    it('should strip costPrice from both product and variants in public storefront API', async () => {
      const productRepo = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'prod-1',
            name: 'Shirt',
            basePrice: 1000,
            costPrice: 600,
            isPublished: true,
            variants: [
              { id: 'var-1', title: 'Black / S', price: 1200, costPrice: 700 },
              { id: 'var-2', title: 'Black / M', price: 1250, costPrice: 720 },
            ],
          },
        ]),
      };

      const findStoreBySlugService = {
        execute: jest.fn().mockResolvedValue({ id: 'store-1', tenantId: 'tenant-1', slug: 'my-store' }),
      };
      const inventoryStockRepo = { find: jest.fn().mockResolvedValue([]) };

      const service = new FindPublicStoreProductsService(productRepo as any, inventoryStockRepo as any, findStoreBySlugService as any);
      const response = await service.execute('my-store');

      expect((response.products[0] as any).costPrice).toBeUndefined();
      expect((response.products[0].variants![0] as any).costPrice).toBeUndefined();
      expect((response.products[0].variants![1] as any).costPrice).toBeUndefined();
      expect(response.products[0].variants![0].price).toBe(1200);
    });
  });
});
