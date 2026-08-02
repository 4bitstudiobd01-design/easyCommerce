import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../order/entities/order.entity';
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
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async calculateNetProfit(tenantId: string): Promise<NetProfitMetricsResponse> {
    const orders = await this.orderRepository.find({
      where: { tenantId },
      relations: ['items'],
    });

    const validOrders = orders.filter(
      (o) => o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'RETURNED' && o.orderStatus !== 'PAYMENT_FAILED',
    );

    const grossRevenue = validOrders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
    const totalDeliveryFees = validOrders.reduce((sum, o) => sum + Number(o.deliveryFee || 0), 0);

    const products = await this.productRepository.find({ where: { tenantId } });
    const productCostMap = new Map<string, number>();
    products.forEach((p) => {
      productCostMap.set(p.id, Number(p.costPrice || 0));
    });

    let totalProductCost = 0;
    validOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const costPrice = productCostMap.get(item.productId) || Number(item.unitPrice || 0) * 0.6;
        totalProductCost += costPrice * item.quantity;
      });
    });

    const netProfit = Number((grossRevenue - totalProductCost).toFixed(2));
    const profitMarginPercentage =
      grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;

    return {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      totalProductCost: Number(totalProductCost.toFixed(2)),
      totalDeliveryFees: Number(totalDeliveryFees.toFixed(2)),
      netProfit,
      profitMarginPercentage,
      totalCompletedOrdersCount: validOrders.length,
    };
  }
}
