import { FindStoreByUserService } from './find-store-by-user.service';
import { StaffStatusEnum } from '../../staff/entities/staff.entity';

/**
 * Staff were given STORE_STAFF roles and granular permissions, but store lookup
 * matched ownerId only. Every merchant endpoint therefore rejected staff with
 * "Merchant must create a store" before their permissions were ever consulted,
 * making staff accounts unusable across the platform.
 */
describe('FindStoreByUserService', () => {
  const ownedStore = { id: 'store-owned', tenantId: 'tenant-1', ownerId: 'owner-1', isActive: true };
  const staffStore = { id: 'store-staffed', tenantId: 'tenant-2', ownerId: 'someone-else', isActive: true };

  const build = (stores: any[], memberships: any[]) => {
    const storeRepository = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        const matches = stores.filter((s) => {
          if (where.ownerId && s.ownerId !== where.ownerId) return false;
          if (where.isActive !== undefined && s.isActive !== where.isActive) return false;
          if (typeof where.id === 'string' && s.id !== where.id) return false;
          // In(...) shape used for the staff branch
          if (where.id && typeof where.id === 'object' && where.id._value) {
            if (!where.id._value.includes(s.id)) return false;
          }
          return true;
        });
        return Promise.resolve(matches[0] || null);
      }),
      find: jest.fn().mockImplementation(({ where }) => {
        const matches = stores.filter((s) => {
          if (where.ownerId && s.ownerId !== where.ownerId) return false;
          if (where.id && typeof where.id === 'object' && where.id._value) {
            if (!where.id._value.includes(s.id)) return false;
          }
          return true;
        });
        return Promise.resolve(matches);
      }),
    };

    const staffRepository = {
      find: jest.fn().mockImplementation(({ where }) =>
        Promise.resolve(
          memberships.filter((m) => m.userId === where.userId && m.status === where.status),
        ),
      ),
    };

    return new FindStoreByUserService(storeRepository as any, staffRepository as any);
  };

  it('still resolves an owned store for the owner (unchanged behaviour)', async () => {
    const service = build([ownedStore], []);
    const result = await service.execute('owner-1');
    expect(result?.id).toBe('store-owned');
  });

  it('resolves the store an active staff member belongs to', async () => {
    const service = build(
      [staffStore],
      [{ userId: 'staff-1', storeId: 'store-staffed', status: StaffStatusEnum.ACTIVE }],
    );

    const result = await service.execute('staff-1');
    expect(result?.id).toBe('store-staffed');
    expect(result?.tenantId).toBe('tenant-2');
  });

  it('does not resolve a store for suspended staff', async () => {
    const service = build(
      [staffStore],
      [{ userId: 'staff-1', storeId: 'store-staffed', status: StaffStatusEnum.SUSPENDED }],
    );

    await expect(service.execute('staff-1')).resolves.toBeNull();
  });

  it('does not resolve a store for pending-invite staff', async () => {
    const service = build(
      [staffStore],
      [{ userId: 'staff-1', storeId: 'store-staffed', status: StaffStatusEnum.PENDING_INVITE }],
    );

    await expect(service.execute('staff-1')).resolves.toBeNull();
  });

  it('returns null for a user who neither owns nor staffs any store', async () => {
    const service = build([ownedStore], []);
    await expect(service.execute('stranger-1')).resolves.toBeNull();
  });

  it('lists staffed stores for a staff member', async () => {
    const service = build(
      [staffStore],
      [{ userId: 'staff-1', storeId: 'store-staffed', status: StaffStatusEnum.ACTIVE }],
    );

    const stores = await service.findAllStoresByUser('staff-1');
    expect(stores.map((s) => s.id)).toEqual(['store-staffed']);
  });
});
