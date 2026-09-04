import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateBranchService } from './update-branch.service';

/**
 * Branches are store-scoped: a caller acting on Store A must never be able to
 * touch Store B's branch even within the same tenant, so lookups filter by
 * (id, tenantId, storeId) together, not tenantId alone.
 */
describe('UpdateBranchService', () => {
  const build = (found: any, warehouse: any = null) => {
    const branchRepository = {
      findOne: jest.fn().mockResolvedValue(found),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockImplementation((branch) => Promise.resolve(branch)),
    };
    const warehouseRepository = {
      findOne: jest.fn().mockResolvedValue(warehouse),
    };

    return {
      service: new UpdateBranchService(branchRepository as any, warehouseRepository as any),
      branchRepository,
      warehouseRepository,
    };
  };

  it('throws NotFoundException when the branch does not belong to the caller store', async () => {
    const { service } = build(null);

    await expect(
      service.execute('tenant-1', 'store-1', 'branch-1', { name: 'New Name' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('scopes the lookup by tenantId and storeId together', async () => {
    const branch = { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1', code: 'DHN-01', isDefault: false };
    const { service, branchRepository } = build(branch, null);

    await service.execute('tenant-1', 'store-1', 'branch-1', { name: 'Updated' });

    expect(branchRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1' },
    });
  });

  it('rejects renaming the code to one already used in the same store', async () => {
    const branch = { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1', code: 'DHN-01', isDefault: false };
    const { service, branchRepository } = build(branch, null);
    branchRepository.findOne
      .mockResolvedValueOnce(branch)
      .mockResolvedValueOnce({ id: 'other-branch', code: 'CTG-01' });

    await expect(
      service.execute('tenant-1', 'store-1', 'branch-1', { code: 'CTG-01' }),
    ).rejects.toThrow(ConflictException);
  });

  it('unsets the previous default when promoting a new default branch', async () => {
    const branch = { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1', code: 'DHN-01', isDefault: false };
    const { service, branchRepository } = build(branch, null);

    const result = await service.execute('tenant-1', 'store-1', 'branch-1', { isDefault: true });

    expect(branchRepository.update).toHaveBeenCalledWith(
      { storeId: 'store-1', isDefault: true },
      { isDefault: false },
    );
    expect(result.isDefault).toBe(true);
  });

  it('rejects a warehouseId that does not belong to the tenant', async () => {
    const branch = { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1', code: 'DHN-01', isDefault: false };
    const { service, warehouseRepository } = build(branch, null);

    await expect(
      service.execute('tenant-1', 'store-1', 'branch-1', { warehouseId: 'warehouse-from-other-tenant' }),
    ).rejects.toThrow(NotFoundException);

    expect(warehouseRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'warehouse-from-other-tenant', tenantId: 'tenant-1' },
    });
  });

  it('accepts and assigns a warehouseId that belongs to the tenant', async () => {
    const branch = { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1', code: 'DHN-01', isDefault: false };
    const { service } = build(branch, { id: 'warehouse-1', tenantId: 'tenant-1' });

    const result = await service.execute('tenant-1', 'store-1', 'branch-1', { warehouseId: 'warehouse-1' });

    expect(result.warehouseId).toBe('warehouse-1');
  });

  it('clears the warehouseId when explicitly set to null (shared/central warehouse)', async () => {
    const branch = {
      id: 'branch-1',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      code: 'DHN-01',
      isDefault: false,
      warehouseId: 'warehouse-1',
    };
    const { service } = build(branch, null);

    const result = await service.execute('tenant-1', 'store-1', 'branch-1', { warehouseId: null as any });

    expect(result.warehouseId).toBeNull();
  });
});
