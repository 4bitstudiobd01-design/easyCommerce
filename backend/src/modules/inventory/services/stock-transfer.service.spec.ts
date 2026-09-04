import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';

/**
 * The unified transfer system moves stock between any combination of
 * warehouses and branches, and (unlike the original warehouse-only
 * version) can target a specific product variant. These tests lock in the
 * source/destination resolution rules and the variant-scoped stock lookup.
 */
describe('StockTransferService', () => {
  const build = (overrides: {
    sourceStock?: any;
    destStock?: any;
    warehouse?: any;
    branch?: any;
    product?: any;
    variant?: any;
  } = {}) => {
    const inventoryStockRepository: any = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
    };
    const branchStockRepository: any = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
    };
    const warehouseRepository = {
      findOne: jest.fn().mockResolvedValue(overrides.warehouse ?? { id: 'wh-1', tenantId: 'tenant-1' }),
    };
    const branchRepository = {
      findOne: jest.fn().mockResolvedValue(overrides.branch ?? { id: 'branch-1', tenantId: 'tenant-1' }),
    };
    const productRepository = {
      findOne: jest.fn().mockResolvedValue(overrides.product ?? { id: 'prod-1', tenantId: 'tenant-1' }),
    };
    const productVariantRepository = {
      findOne: jest.fn().mockResolvedValue(overrides.variant ?? { id: 'var-1', productId: 'prod-1' }),
    };

    const save = jest.fn().mockImplementation((entity) => Promise.resolve(entity));
    const create = jest.fn().mockImplementation((_entity, data) => data);
    const transaction = jest.fn().mockImplementation(async (cb) => cb({ save, create }));
    inventoryStockRepository.manager = { transaction } as any;

    return {
      service: new StockTransferService(
        {} as any, // stockTransferRepository (only used by listStockTransfers)
        inventoryStockRepository as any,
        branchStockRepository as any,
        warehouseRepository as any,
        productRepository as any,
        productVariantRepository as any,
        branchRepository as any,
      ),
      inventoryStockRepository,
      branchStockRepository,
      warehouseRepository,
      branchRepository,
      save,
      create,
    };
  };

  it('rejects a transfer with both a warehouse and branch given for the source', async () => {
    const { service } = build();

    await expect(
      service.transferStock('tenant-1', {
        fromWarehouseId: 'wh-1',
        fromBranchId: 'branch-1',
        toWarehouseId: 'wh-2',
        productId: 'prod-1',
        quantity: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a transfer with neither a warehouse nor a branch given for the destination', async () => {
    const { service } = build();

    await expect(
      service.transferStock('tenant-1', {
        fromWarehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('moves stock from a warehouse into a branch and creates the branch stock row', async () => {
    const sourceStock = { id: 'stock-1', quantityOnHand: 10, productId: 'prod-1', variantId: undefined };
    const { service, inventoryStockRepository, branchStockRepository, save } = build();
    inventoryStockRepository.findOne.mockResolvedValue(sourceStock);
    branchStockRepository.findOne.mockResolvedValue(null);

    const result = await service.transferStock('tenant-1', {
      fromWarehouseId: 'wh-1',
      toBranchId: 'branch-1',
      productId: 'prod-1',
      quantity: 4,
    });

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ quantityOnHand: 6 }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ branchId: 'branch-1', quantityOnHand: 4 }));
    expect(result.fromWarehouseId).toBe('wh-1');
    expect(result.toBranchId).toBe('branch-1');
  });

  it('moves stock between two branches', async () => {
    const sourceStock = { id: 'bstock-1', quantityOnHand: 8, branchId: 'branch-1', productId: 'prod-1' };
    const { service, branchStockRepository, save } = build();
    branchStockRepository.findOne
      .mockResolvedValueOnce(sourceStock) // source lookup
      .mockResolvedValueOnce(null); // destination lookup

    const result = await service.transferStock('tenant-1', {
      fromBranchId: 'branch-1',
      toBranchId: 'branch-2',
      productId: 'prod-1',
      quantity: 3,
    });

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ quantityOnHand: 5 }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ branchId: 'branch-2', quantityOnHand: 3 }));
    expect(result.fromBranchId).toBe('branch-1');
    expect(result.toBranchId).toBe('branch-2');
  });

  it('transfers a specific variant without touching the product-level (no-variant) stock row', async () => {
    const variantStock = { id: 'stock-var', quantityOnHand: 6, productId: 'prod-1', variantId: 'var-1' };
    const { service, inventoryStockRepository } = build();
    inventoryStockRepository.findOne.mockImplementation(({ where }: any) =>
      where.variantId === 'var-1' ? Promise.resolve(variantStock) : Promise.resolve(null),
    );

    const result = await service.transferStock('tenant-1', {
      fromWarehouseId: 'wh-1',
      toWarehouseId: 'wh-2',
      productId: 'prod-1',
      variantId: 'var-1',
      quantity: 2,
    });

    expect(result.variantId).toBe('var-1');
    expect(inventoryStockRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ variantId: 'var-1' }) }),
    );
  });

  it('rejects the transfer when the source has insufficient stock', async () => {
    const { service, inventoryStockRepository } = build();
    inventoryStockRepository.findOne.mockResolvedValue({ id: 'stock-1', quantityOnHand: 1 });

    await expect(
      service.transferStock('tenant-1', {
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-2',
        productId: 'prod-1',
        quantity: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects the transfer when the branch does not belong to the tenant', async () => {
    const { service, branchRepository } = build();
    branchRepository.findOne.mockResolvedValue(null);

    await expect(
      service.transferStock('tenant-1', {
        fromBranchId: 'branch-x',
        toWarehouseId: 'wh-1',
        productId: 'prod-1',
        quantity: 2,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
