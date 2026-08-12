import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';

export interface NetProfitMetricsResponse {
  grossRevenue: number;
  totalProductCost: number;
  totalDeliveryFees: number;
  netProfit: number;
  profitMarginPercentage: number;
  totalCompletedOrdersCount: number;
}

@Injectable()
export class NetProfitService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
  ) {}

  async calculateNetProfit(tenantId: string): Promise<NetProfitMetricsResponse> {
    const orderTotals = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.grandTotal), 0)', 'grossRevenue')
      .addSelect('COALESCE(SUM(order.deliveryFee), 0)', 'totalDeliveryFees')
      .addSelect('COUNT(order.id)', 'totalCompletedOrdersCount')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['CANCELLED', 'RETURNED'],
      })
      .getRawOne<{ grossRevenue: string; totalDeliveryFees: string; totalCompletedOrdersCount: string }>();

    const productCostRow = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin(OrderEntity, 'order', 'order.id = item.orderId')
      .leftJoin(ProductEntity, 'product', 'product.id = item.productId')
      .select(
        'COALESCE(SUM(COALESCE(product.costPrice, item.unitPrice * 0.6) * item.quantity), 0)',
        'totalProductCost',
      )
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['CANCELLED', 'RETURNED'],
      })
      .getRawOne<{ totalProductCost: string }>();

    const grossRevenue = Number(orderTotals?.grossRevenue || 0);
    const totalDeliveryFees = Number(orderTotals?.totalDeliveryFees || 0);
    const totalCompletedOrdersCount = Number(orderTotals?.totalCompletedOrdersCount || 0);
    const totalProductCost = Number(productCostRow?.totalProductCost || 0);

    const netProfit = Number((grossRevenue - totalProductCost).toFixed(2));
    const profitMarginPercentage =
      grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;

    return {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalProductCost: Number(totalProductCost.toFixed(2)),
      totalDeliveryFees: Number(totalDeliveryFees.toFixed(2)),
      netProfit,
      profitMarginPercentage,
      totalCompletedOrdersCount,
    };
  }
}
