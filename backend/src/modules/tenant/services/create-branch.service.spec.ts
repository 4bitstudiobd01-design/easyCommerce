import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateBranchService } from './create-branch.service';

describe('CreateBranchService', () => {
  const build = (existing: any = null, existingCount = 0, warehouse: any = null) => {
    const branchRepository = {
      findOne: jest.fn().mockResolvedValue(existing),
      count: jest.fn().mockResolvedValue(existingCount),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((branch) => Promise.resolve({ id: 'branch-1', ...branch })),
    };
    const warehouseRepository = {
      findOne: jest.fn().mockResolvedValue(warehouse),
    };

    return {
      service: new CreateBranchService(branchRepository as any, warehouseRepository as any),
      branchRepository,
      warehouseRepository,
    };
  };

  it('rejects a duplicate branch code within the same store', async () => {
    const { service } = build({ id: 'existing-branch', code: 'DHN-01' });

    await expect(
      service.execute('tenant-1', 'store-1', { name: 'Dhanmondi Outlet', code: 'DHN-01' }),
    ).rejects.toThrow(ConflictException);
  });

  it('marks the first branch of a store as the default', async () => {
    const { service, branchRepository } = build(null, 0);

    const result = await service.execute('tenant-1', 'store-1', {
      name: 'Dhanmondi Outlet',
      code: 'DHN-01',
    });

    expect(result.isDefault).toBe(true);
    expect(branchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', storeId: 'store-1', isDefault: true }),
    );
  });

  it('does not default a second branch unless explicitly requested', async () => {
    const { service } = build(null, 1);

    const result = await service.execute('tenant-1', 'store-1', {
      name: 'Chittagong Branch',
      code: 'CTG-01',
    });

    expect(result.isDefault).toBe(false);
  });

  it('rejects a warehouseId that does not belong to the tenant', async () => {
    const { service, warehouseRepository } = build(null, 0, null);

    await expect(
      service.execute('tenant-1', 'store-1', {
        name: 'Dhanmondi Outlet',
        code: 'DHN-01',
        warehouseId: 'warehouse-from-other-tenant',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(warehouseRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'warehouse-from-other-tenant', tenantId: 'tenant-1' },
    });
  });

  it('accepts a warehouseId that belongs to the tenant', async () => {
    const { service, branchRepository } = build(null, 0, { id: 'warehouse-1', tenantId: 'tenant-1' });

    const result = await service.execute('tenant-1', 'store-1', {
      name: 'Dhanmondi Outlet',
      code: 'DHN-01',
      warehouseId: 'warehouse-1',
    });

    expect(result.warehouseId).toBe('warehouse-1');
    expect(branchRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ warehouseId: 'warehouse-1' }),
    );
  });
});
