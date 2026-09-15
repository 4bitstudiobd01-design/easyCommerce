import { GetMyPermissionsService } from './get-my-permissions.service';
import { UserRoleEnum } from '../../user/entities/user.entity';

describe('GetMyPermissionsService', () => {
  const build = (options: {
    user?: any;
    store?: any;
    staff?: any;
  }) => {
    const staffRepository = {
      findOne: jest.fn().mockResolvedValue(options.staff ?? null),
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(options.user ?? null),
    };
    const storeRepository = {
      findOne: jest.fn().mockResolvedValue(options.store ?? null),
    };

    return {
      service: new GetMyPermissionsService(
        staffRepository as any,
        userRepository as any,
        storeRepository as any,
      ),
      staffRepository,
      userRepository,
      storeRepository,
    };
  };

  it('grants a store-wide staff member (branchId null) full access to their own permissions regardless of x-branch-id', async () => {
    const { service } = build({
      user: { id: 'user-1', role: UserRoleEnum.STORE_STAFF },
      staff: {
        role: 'INVENTORY_MANAGER',
        branchId: null,
        permissions: ['inventory:read', 'inventory:transfer'],
      },
    });

    const withoutHeader = await service.execute('user-1', 'store-1');
    expect(withoutHeader.permissions).toEqual(['inventory:read', 'inventory:transfer']);
    expect(withoutHeader.isOwner).toBe(false);

    const withMismatchedHeader = await service.execute('user-1', 'store-1', 'branch-999');
    expect(withMismatchedHeader.permissions).toEqual(['inventory:read', 'inventory:transfer']);
  });

  it('grants a branch-scoped staff member their permissions when x-branch-id matches', async () => {
    const { service } = build({
      user: { id: 'user-1', role: UserRoleEnum.STORE_STAFF },
      staff: {
        role: 'ORDER_FULFILLMENT',
        branchId: 'branch-1',
        permissions: ['orders:read', 'orders:manage'],
      },
    });

    const result = await service.execute('user-1', 'store-1', 'branch-1');

    expect(result.permissions).toEqual(['orders:read', 'orders:manage']);
    expect(result.isOwner).toBe(false);
  });

  it('denies a branch-scoped staff member when x-branch-id does not match their branch', async () => {
    const { service } = build({
      user: { id: 'user-1', role: UserRoleEnum.STORE_STAFF },
      staff: {
        role: 'ORDER_FULFILLMENT',
        branchId: 'branch-1',
        permissions: ['orders:read', 'orders:manage'],
      },
    });

    const result = await service.execute('user-1', 'store-1', 'branch-2');

    expect(result.permissions).toEqual([]);
  });

  it('does not deny a branch-scoped staff member when no x-branch-id header is supplied', async () => {
    const { service } = build({
      user: { id: 'user-1', role: UserRoleEnum.STORE_STAFF },
      staff: {
        role: 'ORDER_FULFILLMENT',
        branchId: 'branch-1',
        permissions: ['orders:read', 'orders:manage'],
      },
    });

    const result = await service.execute('user-1', 'store-1');

    expect(result.permissions).toEqual(['orders:read', 'orders:manage']);
  });

  it('SUPER_ADMIN gets full access regardless of branch', async () => {
    const { service } = build({
      user: { id: 'user-1', role: UserRoleEnum.SUPER_ADMIN },
    });

    const result = await service.execute('user-1', 'store-1', 'branch-1');

    expect(result.isOwner).toBe(true);
  });

  it('STORE_OWNER who owns the store gets full access regardless of branch', async () => {
    const { service } = build({
      user: { id: 'user-1', role: UserRoleEnum.STORE_OWNER },
      store: { id: 'store-1', ownerId: 'user-1' },
    });

    const result = await service.execute('user-1', 'store-1', 'branch-1');

    expect(result.isOwner).toBe(true);
  });
});
