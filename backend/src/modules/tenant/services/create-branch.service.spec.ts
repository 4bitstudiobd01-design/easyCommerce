import { ConflictException } from '@nestjs/common';
import { CreateBranchService } from './create-branch.service';

describe('CreateBranchService', () => {
  const build = (existing: any = null, existingCount = 0) => {
    const branchRepository = {
      findOne: jest.fn().mockResolvedValue(existing),
      count: jest.fn().mockResolvedValue(existingCount),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((branch) => Promise.resolve({ id: 'branch-1', ...branch })),
    };

    return {
      service: new CreateBranchService(branchRepository as any),
      branchRepository,
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
});
