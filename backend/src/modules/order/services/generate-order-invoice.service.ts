import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { PaymentEntity } from '../../payment/entities/payment.entity';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';

export interface InvoiceData {
  order: OrderEntity;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeLogo?: string;
  storeDomain?: string;
  amountPaid: number;
  balanceDue: number;
  generatedAt: string;
  invoiceFooterNote?: string;
}

@Injectable()
export class GenerateOrderInvoiceService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  async execute(orderId: string, userId: string): Promise<InvoiceData> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new NotFoundException('Merchant store not found.');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId: store.tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    // Inlined rather than depending on PaymentModule's GetOrderBalanceService, which
    // would create a circular module dependency (PaymentModule already imports
    // OrderModule). Same aggregation as GetOrderBalanceService — kept in sync manually
    // since this is the one place order-side code needs a payment figure.
    const raw = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId: store.tenantId })
      .andWhere('payment."orderId" = :orderId', { orderId })
      .andWhere(`payment.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')`)
      .select(`COALESCE(SUM(payment.amount), 0)`, 'settledAmount')
      .addSelect(`COALESCE(SUM(payment."refundedAmount"), 0)`, 'refundedAmount')
      .getRawOne<{ settledAmount: string; refundedAmount: string }>();

    const settledAmount = Number(raw?.settledAmount ?? 0);
    const refundedAmount = Number(raw?.refundedAmount ?? 0);
    const amountPaid = Math.max(0, settledAmount - refundedAmount);
    const balanceDue = Math.max(0, Number(order.grandTotal) - amountPaid);

    return {
      order,
      storeName: store.name,
      storePhone: store.phone || 'N/A',
      storeAddress: store.address || 'Dhaka, Bangladesh',
      storeLogo: store.logo || undefined,
      storeDomain: store.domain || store.slug ? `${store.domain || store.slug + '.easycommerce.com'}` : undefined,
      amountPaid: Math.round(amountPaid * 100) / 100,
      balanceDue: Math.round(balanceDue * 100) / 100,
      generatedAt: new Date().toISOString(),
      invoiceFooterNote: store.invoiceFooterNote || undefined,
    };
  }
}
