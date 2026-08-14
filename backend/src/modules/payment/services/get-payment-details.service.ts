import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { RefundEntity } from '../entities/refund.entity';
import { PaymentEventEntity } from '../entities/payment-event.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { PaymentDomainService } from './payment-domain.service';
import { PaymentDetailsResponseDto } from '../dto/payment-details-response.dto';
import { PAYMENT_EVENT_LABELS } from '../enums/payment-event-type.enum';
import { PAYMENT_GATEWAY_LABELS, PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PAYMENT_METHOD_LABELS, PaymentMethodTypeEnum } from '../enums/payment-method.enum';

@Injectable()
export class GetPaymentDetailsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepository: Repository<PaymentEventEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(tenantId: string, paymentId: string): Promise<PaymentDetailsResponseDto> {
    // Tenant is part of the lookup, not a post-filter: another merchant's
    // payment is indistinguishable from a non-existent one.
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, tenantId },
    });

    if (!payment) {
      throw new NotFoundException('Payment transaction not found.');
    }

    const [order, refunds, events] = await Promise.all([
      this.orderRepository.findOne({
        where: { id: payment.orderId, tenantId },
        select: ['id', 'orderNumber', 'customerName', 'customerPhone', 'customerId'],
      }),
      this.refundRepository.find({
        where: { paymentId: payment.id, tenantId },
        order: { createdAt: 'ASC' },
      }),
      this.paymentEventRepository.find({
        where: { paymentId: payment.id, tenantId },
        order: { createdAt: 'ASC' },
      }),
    ]);

    const amount = Number(payment.amount) || 0;
    const refundedAmount = Number(payment.refundedAmount) || 0;
    const gateway = payment.gateway || PaymentGatewayEnum.SSLCOMMERZ;
    const method = payment.paymentMethod || PaymentMethodTypeEnum.CARD;

    return {
      id: payment.id,
      transactionNumber:
        payment.transactionNumber || `TXN-${payment.id.slice(0, 8).toUpperCase()}`,
      gatewayTransactionId: this.paymentDomainService.maskGatewayReference(
        payment.bankTranId || payment.tranId,
      ),
      orderId: payment.orderId,
      orderNumber: payment.orderNumber,
      customer: {
        id: payment.customerId || order?.customerId,
        name: order?.customerName || 'Guest Customer',
        phone: order?.customerPhone || undefined,
      },
      gateway,
      gatewayLabel: PAYMENT_GATEWAY_LABELS[gateway] ?? gateway,
      paymentMethod: method,
      paymentMethodLabel: PAYMENT_METHOD_LABELS[method] ?? method,
      amount,
      refundedAmount,
      netAmount: Math.max(0, amount - refundedAmount),
      currency: payment.currency || 'BDT',
      status: payment.status,
      isRefundable: this.paymentDomainService.isRefundable(
        payment.status,
        amount,
        refundedAmount,
      ),
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      refunds: refunds.map((refund) => ({
        id: refund.id,
        refundNumber: refund.refundNumber,
        amount: Number(refund.amount) || 0,
        status: refund.status,
        reason: refund.reason,
        createdAt: refund.createdAt,
        completedAt: refund.completedAt,
      })),
      // Only events the domain actually recorded — never synthesised steps.
      timeline: events.map((event) => ({
        id: event.id,
        type: event.type,
        label: PAYMENT_EVENT_LABELS[event.type] ?? event.type,
        message: event.message,
        createdAt: event.createdAt,
      })),
    };
  }
}
