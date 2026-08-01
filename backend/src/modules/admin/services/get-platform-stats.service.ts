import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';

export interface PlatformStatsOverview {
  totalPlatformRevenue: number;
  totalMerchantsCount: number;
  totalStoresCount: number;
  activeStoresCount: number;
  suspendedStoresCount: number;
  totalSystemOrdersCount: number;
}

@Injectable()
export class GetPlatformStatsService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(): Promise<PlatformStatsOverview> {
    const stores = await this.storeRepository.find();
    const orders = await this.orderRepository.find();
    const users = await this.userRepository.find();

    const totalStoresCount = stores.length;
    const activeStoresCount = stores.filter((s) => s.isActive).length;
    const suspendedStoresCount = stores.filter((s) => !s.isActive).length;

    const totalMerchantsCount = users.filter(
      (u) => u.role === UserRoleEnum.STORE_OWNER || u.role === UserRoleEnum.SUPER_ADMIN,
    ).length;

    const totalSystemOrdersCount = orders.length;
    const totalPlatformRevenue = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);

    return {
      totalPlatformRevenue,
      totalMerchantsCount,
      totalStoresCount,
      activeStoresCount,
      suspendedStoresCount,
      totalSystemOrdersCount,
    };
  }
}
