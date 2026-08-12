import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum } from '../entities/order.entity';

export interface OrderKpiMetrics {
  totalOrders: number;
  pendingConfirmation: number;
  readyToShip: number;
  delivered: number;
}

@Injectable()
export class OrderKpiService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async execute(tenantId: string): Promise<OrderKpiMetrics> {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .select('order.orderStatus', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.tenantId = :tenantId', { tenantId })
      .groupBy('order.orderStatus');

    const rawResults = await query.getRawMany();

    const metrics: OrderKpiMetrics = {
      totalOrders: 0,
      pendingConfirmation: 0,
      readyToShip: 0,
      delivered: 0,
    };

    for (const row of rawResults) {
      const count = Number(row.count) || 0;
      metrics.totalOrders += count;

      if (row.status === OrderStatusEnum.PENDING) {
        metrics.pendingConfirmation += count;
      } else if (row.status === OrderStatusEnum.READY_TO_SHIP) {
        metrics.readyToShip += count;
      } else if (row.status === OrderStatusEnum.DELIVERED) {
        metrics.delivered += count;
      }
    }

    return metrics;
  }
}
