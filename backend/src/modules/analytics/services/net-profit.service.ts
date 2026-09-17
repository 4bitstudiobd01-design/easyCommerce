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
  itemsMissingCostPriceCount: number;
  productsMissingCostPriceCount: number;
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

    // Only items whose product has a real costPrice contribute to totalProductCost —
    // items with no costPrice are excluded rather than estimated, so Net Profit never
    // silently mixes real and guessed costs.
    const productCostRow = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin(OrderEntity, 'order', 'order.id = item.orderId')
      .leftJoin(ProductEntity, 'product', 'product.id = item.productId')
      .select('COALESCE(SUM(product.costPrice * item.quantity), 0)', 'totalProductCost')
      .addSelect(
        'COALESCE(SUM(CASE WHEN product.costPrice IS NULL THEN item.quantity ELSE 0 END), 0)',
        'itemsMissingCostPriceCount',
      )
      .addSelect(
        'COUNT(DISTINCT CASE WHEN product.costPrice IS NULL THEN product.id END)',
        'productsMissingCostPriceCount',
      )
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['CANCELLED', 'RETURNED'],
      })
      .getRawOne<{
        totalProductCost: string;
        itemsMissingCostPriceCount: string;
        productsMissingCostPriceCount: string;
      }>();

    const grossRevenue = Number(orderTotals?.grossRevenue || 0);
    const totalDeliveryFees = Number(orderTotals?.totalDeliveryFees || 0);
    const totalCompletedOrdersCount = Number(orderTotals?.totalCompletedOrdersCount || 0);
    const totalProductCost = Number(productCostRow?.totalProductCost || 0);
    const itemsMissingCostPriceCount = Number(productCostRow?.itemsMissingCostPriceCount || 0);
    const productsMissingCostPriceCount = Number(
      productCostRow?.productsMissingCostPriceCount || 0,
    );

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
      itemsMissingCostPriceCount,
      productsMissingCostPriceCount,
    };
  }
}
