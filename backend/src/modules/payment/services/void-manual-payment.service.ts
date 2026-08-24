import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { OrderEntity, PaymentStatusEnum, PaymentMethodEnum } from '../../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../../order/entities/order-status-history.entity';
import { RecordPaymentEventService } from './record-payment-event.service';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';

/**
 * Reverses a single recorded payment — covers both the "Undo COD Collection"
 * case and undoing a manual/online payment recorded in error. One shared path
 * so the order's paymentStatus is always recomputed the same way regardless of
 * which kind of payment is being voided.
 */
@Injectable()
export class VoidManualPaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly recordPaymentEventService: RecordPaymentEventService,
  ) {}

  async execute(paymentId: string, tenantId: string, userId: string, reason: string): Promise<OrderEntity> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId, tenantId } });
    if (!payment) {
      throw new NotFoundException(`Payment with ID "${paymentId}" not found.`);
    }
    if (payment.status !== PaymentTransactionStatusEnum.COMPLETED) {
      throw new BadRequestException(`Cannot void a payment with status ${payment.status}.`);
    }

    const order = await this.orderRepository.findOne({ where: { id: payment.orderId, tenantId } });
    if (!order) {
      throw new NotFoundException(`Order with ID "${payment.orderId}" not found.`);
    }

    const updatedOrder = await this.dataSource.transaction(async (manager) => {
      payment.status = PaymentTransactionStatusEnum.CANCELLED;
      await manager.save(payment);

      // Recompute from what's left rather than assuming this was the only
      // payment — an order can have several manual/online payments recorded
      // against it (partial payments over time).
      const remaining = await manager.find(PaymentEntity, {
        where: { orderId: order.id, tenantId, status: PaymentTransactionStatusEnum.COMPLETED },
      });
      const amountPaid = remaining.reduce(
        (sum, p) => sum + Math.max(0, Number(p.amount) - Number(p.refundedAmount)),
        0,
      );
      const grandTotal = Number(order.grandTotal);

      let nextPaymentStatus: PaymentStatusEnum;
      if (amountPaid <= 0) {
        nextPaymentStatus =
          order.paymentMethod === PaymentMethodEnum.COD
            ? PaymentStatusEnum.COD_PENDING
            : PaymentStatusEnum.UNPAID;
      } else if (amountPaid >= grandTotal) {
        nextPaymentStatus =
          order.paymentMethod === PaymentMethodEnum.COD
            ? PaymentStatusEnum.COD_COLLECTED
            : PaymentStatusEnum.PAID;
      } else {
        nextPaymentStatus = PaymentStatusEnum.PARTIALLY_PAID;
      }

      order.paymentStatus = nextPaymentStatus;
      const saved = await manager.save(order);

      const history = manager.create(OrderStatusHistoryEntity, {
        orderId: order.id,
        previousStatus: order.orderStatus,
        newStatus: order.orderStatus,
        changedBy: userId,
        reason: `Payment ${payment.tranId} voided: ${reason}`,
        tenantId,
      });
      await manager.save(history);

      return saved;
    });

    await this.recordPaymentEventService.execute({
      tenantId,
      paymentId: payment.id,
      type: PaymentEventTypeEnum.PAYMENT_CANCELLED,
      message: `Payment voided: ${reason}`,
    });

    return updatedOrder;
  }
}
