import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { UserEntity } from '../../user/entities/user.entity';

export interface AdminStoreDetail {
  id: string;
  name: string;
  slug: string;
  category?: string;
  phone?: string;
  address?: string;
  domain?: string;
  currency: string;
  isActive: boolean;
  tenantId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ordersCount: number;
  totalRevenue: number;
  createdAt: Date;
}

@Injectable()
export class ListAllStoresService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(): Promise<AdminStoreDetail[]> {
    const stores = await this.storeRepository.find({
      order: { createdAt: 'DESC' },
    });

    const orders = await this.orderRepository.find();
    const users = await this.userRepository.find();

    const userMap = new Map(users.map((u) => [u.id, u]));

    const storeDetails: AdminStoreDetail[] = [];

    for (const store of stores) {
      const storeOrders = orders.filter((o) => o.tenantId === store.tenantId);
      const totalRevenue = storeOrders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
      const owner = userMap.get(store.ownerId);

      storeDetails.push({
        id: store.id,
        name: store.name,
        slug: store.slug,
        category: store.category,
        phone: store.phone,
        address: store.address,
        domain: store.domain,
        currency: store.currency,
        isActive: store.isActive,
        tenantId: store.tenantId,
        ownerId: store.ownerId,
        ownerName: owner?.fullName || 'Merchant Owner',
        ownerEmail: owner?.email || 'merchant@easycommerce.com',
        ordersCount: storeOrders.length,
        totalRevenue,
        createdAt: store.createdAt,
      });
    }

    return storeDetails;
  }
}
