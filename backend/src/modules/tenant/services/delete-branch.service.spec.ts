import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeleteBranchService } from './delete-branch.service';

/**
 * branch_stocks cascades on branch deletion at the DB level, so the app
 * layer must block deleting a branch that still has stock recorded — the
 * same guard DeleteWarehouseService applies for inventory_stocks — or a
 * merchant could silently lose stock records.
 */
describe('DeleteBranchService', () => {
  const build = (branch: any, stockCount = 0) => {
    const branchRepository = {
      findOne: jest.fn().mockResolvedValue(branch),
      count: jest.fn().mockResolvedValue(1),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const branchStockRepository = {
      count: jest.fn().mockResolvedValue(stockCount),
    };

    return {
      service: new DeleteBranchService(branchRepository as any, branchStockRepository as any),
      branchRepository,
      branchStockRepository,
    };
  };

  it('throws NotFoundException when the branch does not belong to the caller store', async () => {
    const { service } = build(null);

    await expect(service.execute('tenant-1', 'store-1', 'branch-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects deletion when the branch still has stock recorded', async () => {
    const branch = { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1', isDefault: false };
    const { service, branchRepository } = build(branch, 3);

    await expect(service.execute('tenant-1', 'store-1', 'branch-1')).rejects.toThrow(BadRequestException);
    expect(branchRepository.remove).not.toHaveBeenCalled();
  });

  it('deletes a branch with no stock', async () => {
    const branch = { id: 'branch-1', tenantId: 'tenant-1', storeId: 'store-1', isDefault: false };
    const { service, branchRepository } = build(branch, 0);

    const result = await service.execute('tenant-1', 'store-1', 'branch-1');

    expect(branchRepository.remove).toHaveBeenCalledWith(branch);
    expect(result.message).toBe('Branch deleted successfully.');
  });
});
