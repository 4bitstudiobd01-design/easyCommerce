import { SetMetadata } from '@nestjs/common';
import { StaffPermissionType } from '../../modules/staff/entities/staff.entity';

export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Declares the staff permissions an endpoint requires.
 *
 * The permission vocabulary is the existing StaffPermissionType used by the staff
 * module and the merchant UI — this decorator only enforces it server-side, it does
 * not introduce a second permission system.
 *
 * A handler passes when the caller holds ANY of the listed permissions. Store owners
 * and super admins implicitly hold all of them (see PermissionsGuard).
 */
export const RequirePermissions = (...permissions: StaffPermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
