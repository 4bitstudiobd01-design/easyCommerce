import { NotFoundException, ConflictException } from '@nestjs/common';
import { DeleteProductService } from './delete-product.service';
import { ProductStatus } from '../enums/product-status.enum';

/**
 * order_items stores productId WITHOUT a foreign key, so hard-deleting a product that
 * has been ordered would leave order lines pointing at a missing row and silently
 * corrupt historical revenue/units reporting. Such products must be archived instead.
 */
describe('DeleteProductService', () => {
  const build = (product: any, orderedCount: number) => {
    const productRepository = {
      findOne: jest.fn().mockResolvedValue(product),
      save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
    };
    const orderItemRepository = { count: jest.fn().mockResolvedValue(orderedCount) };
    const manager = { query: jest.fn().mockResolvedValue(undefined), delete: jest.fn().mockResolvedValue({}) };
    const dataSource = { transaction: jest.fn().mockImplementation((cb: any) => cb(manager)) };

    return {
      service: new DeleteProductService(productRepository as any, orderItemRepository as any, dataSource as any),
      productRepository,
      dataSource,
      manager,
    };
  };

  it('archives a product that appears in orders instead of deleting it', async () => {
    const product = { id: 'p1', name: 'Sold Item', status: ProductStatus.ACTIVE, isPublished: true };
    const { service, productRepository, dataSource } = build(product, 13);

    const result = await service.execute('p1', 'tenant-1');

    expect(result.archived).toBe(true);
    expect(product.status).toBe(ProductStatus.ARCHIVED);
    expect(product.isPublished).toBe(false);
    expect(productRepository.save).toHaveBeenCalledWith(product);
    // The row must survive so order history and analytics stay intact.
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('hard deletes a product that has never been ordered', async () => {
    const product = { id: 'p2', name: 'Unsold', status: ProductStatus.DRAFT, isPublished: false };
    const { service, dataSource, manager } = build(product, 0);

    const result = await service.execute('p2', 'tenant-1');

    expect(result.archived).toBe(false);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(manager.delete).toHaveBeenCalledWith(expect.anything(), { id: 'p2', tenantId: 'tenant-1' });
  });

  it('scopes the lookup to the tenant so another store cannot delete the product', async () => {
    const { service, productRepository } = build(null, 0);

    await expect(service.execute('p3', 'tenant-2')).rejects.toThrow(NotFoundException);
    expect(productRepository.findOne).toHaveBeenCalledWith({ where: { id: 'p3', tenantId: 'tenant-2' } });
  });

  it('rejects deleting an already-archived product that still has orders', async () => {
    const product = { id: 'p4', name: 'Old', status: ProductStatus.ARCHIVED, isPublished: false };
    const { service } = build(product, 5);

    await expect(service.execute('p4', 'tenant-1')).rejects.toThrow(ConflictException);
  });

  it('counts order items scoped to the tenant', async () => {
    const product = { id: 'p5', name: 'Item', status: ProductStatus.ACTIVE, isPublished: true };
    const { service } = build(product, 1);

    const orderItemRepository = (service as unknown as { orderItemRepository: { count: jest.Mock } })
      .orderItemRepository;

    await service.execute('p5', 'tenant-1');

    // An unscoped count would let another store's orders decide this store's outcome.
    expect(orderItemRepository.count).toHaveBeenCalledWith({
      where: { productId: 'p5', tenantId: 'tenant-1' },
    });
  });
});
