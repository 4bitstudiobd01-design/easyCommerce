import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffMemberEntity, StaffPermissionType } from '../entities/staff.entity';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';

const ALL_PERMISSIONS: StaffPermissionType[] = [
  'products:read',
  'products:write',
  'orders:read',
  'orders:manage',
  'inventory:read',
  'inventory:transfer',
  'reviews:read',
  'reviews:moderate',
  'customers:read',
  'coupons:read',
  'coupons:write',
  'analytics:read',
  'settings:read',
  'settings:write',
  'staff:manage',
  'hr:employees:manage',
  'hr:employees:read',
  'hr:attendance:manage',
  'hr:leave:manage',
  'hr:leave:self',
  'hr:shifts:manage',
  'hr:expenses:manage',
  'hr:payroll:manage',
  'hr:notices:manage',
  'accounting:read',
  'accounting:manage',
  'accounting:settings:manage',
  'purchases:read',
  'purchases:manage',
  'finance:read',
  'finance:manage',
  'finance:transactions:manage',
  'finance:invoices:manage',
  'finance:bills:manage',
  'finance:accounts:manage',
  'finance:transfers:manage',
  'finance:reports:read',
  'finance:settings:manage',
];

@Injectable()
export class GetMyPermissionsService {
  constructor(
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(
    userId: string,
    storeId?: string,
    branchId?: string,
  ): Promise<{ role: string; isOwner: boolean; permissions: StaffPermissionType[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return { role: 'GUEST', isOwner: false, permissions: [] };
    }

    if (user.role === UserRoleEnum.SUPER_ADMIN) {
      return {
        role: user.role,
        isOwner: true,
        permissions: ALL_PERMISSIONS,
      };
    }

    if (user.role === UserRoleEnum.STORE_OWNER) {
      if (!storeId) {
        return {
          role: user.role,
          isOwner: true,
          permissions: ALL_PERMISSIONS,
        };
      }

      const ownsStore = await this.storeRepository.findOne({
        where: { id: storeId, ownerId: user.id },
      });

      if (ownsStore) {
        return {
          role: user.role,
          isOwner: true,
          permissions: ALL_PERMISSIONS,
        };
      }

      return { role: user.role, isOwner: false, permissions: [] };
    }

    if (!storeId) {
      return { role: user.role, isOwner: false, permissions: [] };
    }

    const staff = await this.staffRepository.findOne({
      where: { userId: user.id, storeId },
    });

    if (!staff) {
      return { role: 'STORE_STAFF', isOwner: false, permissions: [] };
    }

    // Branch scoping: a staff row with a null branchId is store-wide and works across
    // every branch — this is the default for every staff row that existed before branch
    // scoping was introduced, and behavior for it must stay completely unchanged.
    //
    // A staff row with a branchId set is restricted to that branch. Only an EXPLICIT
    // mismatch (request supplies x-branch-id and it differs) denies access — many
    // endpoints aren't branch-aware yet in this phase, so the mere absence of the header
    // must never lock out a branch-scoped staff member.
    if (staff.branchId && branchId && staff.branchId !== branchId) {
      return { role: staff.role, isOwner: false, permissions: [] };
    }

    return {
      role: staff.role,
      isOwner: false,
      permissions: staff.permissions || [],
    };
  }
}
