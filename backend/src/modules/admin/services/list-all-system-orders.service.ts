import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../order/entities/order.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';

export interface AdminSystemOrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  storeSlug: string;
  storeName: string;
  createdAt: Date;
}

@Injectable()
export class ListAllSystemOrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
  ) {}

  async execute(): Promise<AdminSystemOrderDetail[]> {
    const orders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });

    const stores = await this.storeRepository.find();
    const storeMap = new Map(stores.map((s) => [s.tenantId, s]));

    return orders.map((order) => {
      const store = storeMap.get(order.tenantId);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        city: order.city,
        grandTotal: Number(order.grandTotal),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        storeSlug: order.storeSlug,
        storeName: store?.name || order.storeSlug,
        createdAt: order.createdAt,
      };
    });
  }
}
