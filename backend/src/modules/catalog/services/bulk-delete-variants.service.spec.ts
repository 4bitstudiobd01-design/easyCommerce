import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BulkDeleteVariantsService } from './bulk-delete-variants.service';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductEntity } from '../entities/product.entity';

describe('BulkDeleteVariantsService', () => {
  let service: BulkDeleteVariantsService;
  let variantRepo: any;
  let productRepo: any;
  let managerMock: any;

  const tenantId = 'tenant-1';
  const productId = 'prod-1';

  beforeEach(async () => {
    variantRepo = { find: jest.fn() };
    productRepo = { findOne: jest.fn().mockResolvedValue({ id: productId, tenantId }) };

    managerMock = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const dataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) => cb(managerMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkDeleteVariantsService,
        { provide: getRepositoryToken(ProductVariantEntity), useValue: variantRepo },
        { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<BulkDeleteVariantsService>(BulkDeleteVariantsService);
  });

  it('deletes every requested variant in one transaction', async () => {
    variantRepo.find.mockResolvedValue([
      { id: 'v1', productId, tenantId },
      { id: 'v2', productId, tenantId },
    ]);

    const result = await service.execute(productId, tenantId, ['v1', 'v2']);

    expect(result.deletedCount).toBe(2);
    expect(managerMock.delete).toHaveBeenCalledWith(ProductVariantEntity, {
      id: expect.anything(),
      productId,
      tenantId,
    });
  });

  it('clears hasVariants when no variants remain after deletion', async () => {
    variantRepo.find.mockResolvedValue([{ id: 'v1', productId, tenantId }]);
    managerMock.count.mockResolvedValue(0);

    await service.execute(productId, tenantId, ['v1']);

    expect(managerMock.update).toHaveBeenCalledWith(
      ProductEntity,
      { id: productId, tenantId },
      { hasVariants: false },
    );
  });

  it('keeps hasVariants when some variants remain', async () => {
    variantRepo.find.mockResolvedValue([{ id: 'v1', productId, tenantId }]);
    managerMock.count.mockResolvedValue(3);

    await service.execute(productId, tenantId, ['v1']);

    expect(managerMock.update).not.toHaveBeenCalled();
  });

  it('rejects when a requested variant does not belong to the product', async () => {
    variantRepo.find.mockResolvedValue([{ id: 'v1', productId, tenantId }]);

    await expect(service.execute(productId, tenantId, ['v1', 'v2'])).rejects.toThrow(NotFoundException);
  });

  it('rejects when the product is not found for this tenant', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.execute(productId, tenantId, ['v1'])).rejects.toThrow(NotFoundException);
  });
});
