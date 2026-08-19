import { FindPublicStoreProductsService } from './find-public-store-products.service';
import { FindStoreBySlugService } from '../../tenant/services/find-store-by-slug.service';

/**
 * This is the data source behind the public storefront (GET /catalog/public/store/:slug/products).
 * It must never leak merchant credentials (smtpPass, courier API keys, etc.) or product costPrice
 * to an anonymous visitor.
 */
describe('FindPublicStoreProductsService', () => {
  const build = (store: any, products: any[]) => {
    const productRepository = { find: jest.fn().mockResolvedValue(products) };
    const findStoreBySlugService = { execute: jest.fn().mockResolvedValue(store) } as unknown as FindStoreBySlugService;
    return new FindPublicStoreProductsService(productRepository as any, findStoreBySlugService);
  };

  it('strips merchant-private store credentials from the response', async () => {
    const service = build(
      {
        id: 'store-1',
        slug: 'sumon-fashion',
        tenantId: 'tenant-1',
        logo: 'https://cdn.example.com/logo.png',
        primaryColor: '#2563eb',
        smtpPass: 'super-secret',
        steadfastApiKey: 'sf-secret',
        ownerId: 'owner-1',
      },
      [],
    );

    const result = await service.execute('sumon-fashion');

    expect(result.store).not.toHaveProperty('smtpPass');
    expect(result.store).not.toHaveProperty('steadfastApiKey');
    expect(result.store).not.toHaveProperty('ownerId');
    expect(result.store.logo).toBe('https://cdn.example.com/logo.png');
    expect(result.store.primaryColor).toBe('#2563eb');
  });

  it('still strips product/variant costPrice (pre-existing behaviour)', async () => {
    const service = build(
      { id: 'store-1', slug: 'sumon-fashion', tenantId: 'tenant-1' },
      [{ id: 'p1', costPrice: 500, variants: [{ id: 'v1', costPrice: 300 }] }],
    );

    const result = await service.execute('sumon-fashion');

    expect(result.products[0]).not.toHaveProperty('costPrice');
    expect((result.products[0] as any).variants[0]).not.toHaveProperty('costPrice');
  });
});
