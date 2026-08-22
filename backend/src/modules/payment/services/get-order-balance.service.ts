import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { OrderEntity } from '../../order/entities/order.entity';

export interface OrderBalance {
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
}

/**
 * Sums completed (net of refunds) payments against one order's grand total.
 * Mirrors the settled-volume aggregation already proven in
 * GetPaymentSummaryService, scoped to a single orderId instead of a tenant-wide
 * date range.
 */
@Injectable()
export class GetOrderBalanceService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async execute(tenantId: string, orderId: string): Promise<OrderBalance> {
    const order = await this.orderRepository.findOne({ where: { id: orderId, tenantId } });
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    const raw = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment."orderId" = :orderId', { orderId })
      .andWhere(`payment.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')`)
      .select(`COALESCE(SUM(payment.amount), 0)`, 'settledAmount')
      .addSelect(`COALESCE(SUM(payment."refundedAmount"), 0)`, 'refundedAmount')
      .getRawOne<{ settledAmount: string; refundedAmount: string }>();

    const settledAmount = Number(raw?.settledAmount ?? 0);
    const refundedAmount = Number(raw?.refundedAmount ?? 0);
    const amountPaid = Math.max(0, settledAmount - refundedAmount);
    const grandTotal = Number(order.grandTotal);
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    return {
      grandTotal: Math.round(grandTotal * 100) / 100,
      amountPaid: Math.round(amountPaid * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
    };
  }
}
