import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { StaffPermissionType } from '../../modules/staff/entities/staff.entity';

/**
 * Staff permissions were stored on staff_members and returned to the merchant UI, but
 * no backend guard enforced them — the UI hid buttons while the API stayed open, so a
 * `products:read` staff member could still write products or export cost prices by
 * calling the endpoint directly.
 */
describe('PermissionsGuard', () => {
  const buildContext = (userId?: string, storeId?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: userId ? { sub: userId } : undefined,
          headers: storeId ? { 'x-store-id': storeId } : {},
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  const buildGuard = (
    required: StaffPermissionType[] | undefined,
    resolved: { permissions: StaffPermissionType[]; isOwner: boolean },
  ) => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(required) } as unknown as Reflector;
    const permissionsService = {
      execute: jest.fn().mockResolvedValue({ role: 'CUSTOM', ...resolved }),
    };
    return {
      guard: new PermissionsGuard(reflector, permissionsService as any),
      permissionsService,
    };
  };

  it('allows a handler that declares no permissions', async () => {
    const { guard } = buildGuard(undefined, { permissions: [], isOwner: false });
    await expect(guard.canActivate(buildContext('user-1'))).resolves.toBe(true);
  });

  it('allows staff holding the required permission', async () => {
    const { guard } = buildGuard(['products:read'], { permissions: ['products:read'], isOwner: false });
    await expect(guard.canActivate(buildContext('user-1', 'store-1'))).resolves.toBe(true);
  });

  it('blocks staff who only hold the read permission from a write endpoint', async () => {
    const { guard } = buildGuard(['products:write'], { permissions: ['products:read'], isOwner: false });
    await expect(guard.canActivate(buildContext('user-1', 'store-1'))).rejects.toThrow(ForbiddenException);
  });

  it('blocks staff with no permissions at all', async () => {
    const { guard } = buildGuard(['products:read'], { permissions: [], isOwner: false });
    await expect(guard.canActivate(buildContext('user-1', 'store-1'))).rejects.toThrow(ForbiddenException);
  });

  it('always allows store owners and super admins', async () => {
    const { guard } = buildGuard(['products:write'], { permissions: [], isOwner: true });
    await expect(guard.canActivate(buildContext('owner-1', 'store-1'))).resolves.toBe(true);
  });

  it('passes when the caller holds any one of several accepted permissions', async () => {
    const { guard } = buildGuard(['products:read', 'inventory:read'], {
      permissions: ['inventory:read'],
      isOwner: false,
    });
    await expect(guard.canActivate(buildContext('user-1', 'store-1'))).resolves.toBe(true);
  });

  it('rejects an unauthenticated request', async () => {
    const { guard } = buildGuard(['products:read'], { permissions: [], isOwner: false });
    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(ForbiddenException);
  });

  it('resolves permissions against the requested store, not a cached token claim', async () => {
    // Permissions are read live so a revoked permission takes effect immediately
    // rather than when the JWT expires.
    const { guard, permissionsService } = buildGuard(['products:read'], {
      permissions: ['products:read'],
      isOwner: false,
    });

    await guard.canActivate(buildContext('user-1', 'store-42'));

    expect(permissionsService.execute).toHaveBeenCalledWith('user-1', 'store-42');
  });
});
