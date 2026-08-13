import { UpdateProductSeoService } from './update-product-seo.service';
import {
  AddRelatedProductService,
  RemoveRelatedProductService,
  ListRelatedProductsService,
  ReorderRelatedProductsService,
} from './related-products.service';

describe('Product Details, SEO & Related Products Services (Chunk 12)', () => {
  describe('UpdateProductSeoService', () => {
    it('should update SEO title, meta description, and search index flag', async () => {
      const product = {
        id: 'p-1',
        name: 'Men Polo Shirt',
        slug: 'men-polo-shirt',
        seoTitle: undefined,
        metaDescription: undefined,
        isSearchEngineIndexed: true,
        tenantId: 'tenant-1',
      };

      const productRepo = {
        findOne: jest.fn().mockResolvedValue(product),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      };

      const slugService = {
        generateSlug: jest.fn().mockResolvedValue('mens-polo-shirt-seo'),
      };

      const service = new UpdateProductSeoService(productRepo as any, slugService as any);
      const updated = await service.execute('p-1', 'tenant-1', {
        seoTitle: 'Custom SEO Title',
        metaDescription: 'Custom meta description for Google',
        slug: 'mens-polo-shirt-seo',
        isSearchEngineIndexed: false,
      });

      expect(updated.seoTitle).toBe('Custom SEO Title');
      expect(updated.metaDescription).toBe('Custom meta description for Google');
      expect(updated.slug).toBe('mens-polo-shirt-seo');
      expect(updated.isSearchEngineIndexed).toBe(false);
    });
  });

  describe('AddRelatedProductService', () => {
    it('should throw BadRequestException when attempting self-relation', async () => {
      const relationRepo = {} as any;
      const productRepo = {} as any;

      const service = new AddRelatedProductService(relationRepo, productRepo);

      await expect(
        service.execute('prod-1', 'tenant-1', { relatedProductId: 'prod-1' }),
      ).rejects.toThrow('A product cannot be related to itself');
    });

    it('should throw NotFoundException when related product does not exist in store', async () => {
      const relationRepo = {} as any;
      const productRepo = {
        findOne: jest.fn()
          .mockResolvedValueOnce({ id: 'prod-1', tenantId: 'tenant-1' }) // parent product found
          .mockResolvedValueOnce(null), // target related product not found in tenant-1
      };

      const service = new AddRelatedProductService(relationRepo, productRepo as any);

      await expect(
        service.execute('prod-1', 'tenant-1', { relatedProductId: 'prod-other-tenant' }),
      ).rejects.toThrow('Target related product not found in store');
    });

    it('should create valid relation when both products belong to tenant', async () => {
      const relationRepo = {
        findOne: jest.fn().mockResolvedValue(null), // no duplicate
        find: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((dto) => ({ id: 'rel-1', ...dto })),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      };

      const productRepo = {
        findOne: jest.fn().mockImplementation(({ where }) => Promise.resolve({ id: where.id, tenantId: 'tenant-1' })),
      };

      const service = new AddRelatedProductService(relationRepo as any, productRepo as any);
      const rel = await service.execute('prod-1', 'tenant-1', { relatedProductId: 'prod-2' });

      expect(rel.productId).toBe('prod-1');
      expect(rel.relatedProductId).toBe('prod-2');
      expect(rel.tenantId).toBe('tenant-1');
      expect(rel.sortOrder).toBe(0);
    });
  });

  describe('ReorderRelatedProductsService', () => {
    it('should update sortOrder for related products in array order', async () => {
      const r1 = { id: 'r1', productId: 'p1', relatedProductId: 'rp1', sortOrder: 0, tenantId: 'tenant-1' };
      const r2 = { id: 'r2', productId: 'p1', relatedProductId: 'rp2', sortOrder: 1, tenantId: 'tenant-1' };

      const relationRepo = {
        find: jest.fn().mockResolvedValue([r1, r2]),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      };

      const service = new ReorderRelatedProductsService(relationRepo as any);
      await service.execute('p1', 'tenant-1', { relatedProductIds: ['rp2', 'rp1'] });

      expect(r2.sortOrder).toBe(0);
      expect(r1.sortOrder).toBe(1);
    });
  });
});
