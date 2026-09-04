import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { StaffPermissionType } from '../../modules/staff/entities/staff.entity';
import { GetMyPermissionsService } from '../../modules/staff/services/get-my-permissions.service';

/**
 * Enforces staff permissions on the server.
 *
 * Permissions were previously stored on staff_members and returned to the merchant UI,
 * but no backend guard ever checked them: the UI hid buttons while the API stayed open,
 * so a staff member holding only `products:read` could still write products or export
 * cost prices by calling the endpoint directly.
 *
 * Permissions are resolved per request through GetMyPermissionsService (the same source
 * of truth the UI reads) rather than from the JWT, because the token only carries
 * sub/email/role — reading them live also means a revoked permission takes effect
 * immediately instead of when the token expires.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly getMyPermissionsService: GetMyPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<StaffPermissionType[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Authentication required to access this resource.');
    }

    const storeId = request.headers['x-store-id'] as string | undefined;
    const branchId = request.headers['x-branch-id'] as string | undefined;
    const { permissions, isOwner } = await this.getMyPermissionsService.execute(
      userId,
      storeId,
      branchId,
    );

    // Owners and super admins resolve to the full permission set already.
    if (isOwner) {
      return true;
    }

    const granted = required.some((permission) => permissions.includes(permission));
    if (!granted) {
      throw new ForbiddenException(
        `You do not have permission to perform this action. Required: ${required.join(' or ')}.`,
      );
    }

    return true;
  }
}
