import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { OrderEntity } from '../../order/entities/order.entity';

export interface PublicPlatformStats {
  activeStoresCount: number;
  totalOrdersCount: number;
  totalOrderValue: number;
  modulesShipped: number;
}

/**
 * Aggregated, non-sensitive platform figures for the public landing page.
 *
 * Unlike GetPlatformStatsService (SUPER_ADMIN only) this runs unauthenticated,
 * so it deliberately exposes only coarse totals — never per-merchant or
 * per-tenant detail — and aggregates in SQL instead of loading whole tables.
 */
@Injectable()
export class GetPublicPlatformStatsService {
  /** Backend modules under src/modules — a fixed product fact, not a DB value. */
  private static readonly MODULES_SHIPPED = 19;

  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async execute(): Promise<PublicPlatformStats> {
    const [activeStoresCount, totalOrdersCount, orderValueRow] = await Promise.all([
      this.storeRepository.count({ where: { isActive: true } }),
      this.orderRepository.count(),
      this.orderRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.grandTotal), 0)', 'sum')
        .getRawOne<{ sum: string }>(),
    ]);

    return {
      activeStoresCount,
      totalOrdersCount,
      totalOrderValue: Number(orderValueRow?.sum ?? 0),
      modulesShipped: GetPublicPlatformStatsService.MODULES_SHIPPED,
    };
  }
}
