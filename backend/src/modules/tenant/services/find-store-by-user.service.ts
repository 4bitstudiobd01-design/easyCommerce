import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';
import { StaffMemberEntity, StaffStatusEnum } from '../../staff/entities/staff.entity';

@Injectable()
export class FindStoreByUserService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(StaffMemberEntity)
    private readonly staffRepository: Repository<StaffMemberEntity>,
  ) {}

  /**
   * Resolves the store a user is acting on.
   *
   * Ownership is checked first so owner behaviour is unchanged. Active staff members
   * fall back to the stores they belong to: staff were given STORE_STAFF roles and
   * granular permissions, but store lookup matched ownerId only, so every merchant
   * endpoint rejected them with "Merchant must create a store" before their
   * permissions were ever consulted.
   *
   * Suspended and pending-invite staff intentionally resolve to nothing.
   */
  async execute(userId: string, storeId?: string): Promise<StoreEntity | null> {
    if (storeId) {
      const store = await this.storeRepository.findOne({
        where: { id: storeId, ownerId: userId, isActive: true },
      });
      if (store) return store;
    }

    const ownedStore = await this.storeRepository.findOne({
      where: { ownerId: userId, isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (ownedStore) return ownedStore;

    const staffStoreIds = await this.findStaffStoreIds(userId);
    if (staffStoreIds.length === 0) return null;

    if (storeId && staffStoreIds.includes(storeId)) {
      const scopedStore = await this.storeRepository.findOne({
        where: { id: storeId, isActive: true },
      });
      if (scopedStore) return scopedStore;
    }

    return this.storeRepository.findOne({
      where: { id: In(staffStoreIds), isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findAllStoresByUser(userId: string): Promise<StoreEntity[]> {
    const ownedStores = await this.storeRepository.find({
      where: { ownerId: userId, isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (ownedStores.length > 0) return ownedStores;

    const staffStoreIds = await this.findStaffStoreIds(userId);
    if (staffStoreIds.length === 0) return [];

    return this.storeRepository.find({
      where: { id: In(staffStoreIds), isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  private async findStaffStoreIds(userId: string): Promise<string[]> {
    const memberships = await this.staffRepository.find({
      where: { userId, status: StaffStatusEnum.ACTIVE },
      select: ['storeId'],
    });
    return memberships.map((m) => m.storeId);
  }
}
