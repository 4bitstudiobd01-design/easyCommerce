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

    return {
      role: staff.role,
      isOwner: false,
      permissions: staff.permissions || [],
    };
  }
}
