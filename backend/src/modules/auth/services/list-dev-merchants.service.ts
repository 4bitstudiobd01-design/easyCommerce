import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { DevMerchantListItemDto } from '../dto/dev-merchant-list-item.dto';

@Injectable()
export class ListDevMerchantsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  /**
   * Lists merchant accounts for the dev-only "log in as merchant" switcher, so HRMS
   * (and future modules) can be reviewed from the merchant's own dashboard without a
   * real impersonation feature. Hard-disabled in production — this is a local/staging
   * testing aid, not a support tool.
   */
  async execute(): Promise<DevMerchantListItemDto[]> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev merchant switcher is disabled in production environments.');
    }

    const owners = await this.userRepository.find({
      where: { role: UserRoleEnum.STORE_OWNER, isActive: true },
      order: { fullName: 'ASC' },
    });

    if (owners.length === 0) return [];

    const stores = await this.storeRepository.find({
      where: { ownerId: In(owners.map((owner) => owner.id)), isActive: true },
      order: { createdAt: 'ASC' },
    });

    const storesByOwnerId = new Map<string, StoreEntity[]>();
    for (const store of stores) {
      const existing = storesByOwnerId.get(store.ownerId) ?? [];
      existing.push(store);
      storesByOwnerId.set(store.ownerId, existing);
    }

    return owners.map((owner) => ({
      userId: owner.id,
      fullName: owner.fullName,
      email: owner.email,
      stores: (storesByOwnerId.get(owner.id) ?? []).map((store) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
      })),
    }));
  }
}
