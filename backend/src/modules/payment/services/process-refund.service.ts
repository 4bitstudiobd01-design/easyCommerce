import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefundEntity, RefundStatusEnum } from '../entities/refund.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { OrderEntity, PaymentStatusEnum } from '../../order/entities/order.entity';
import { OrderStatusHistoryEntity } from '../../order/entities/order-status-history.entity';
import { PaymentDomainService } from './payment-domain.service';
import { RecordPaymentEventService } from './record-payment-event.service';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';

@Injectable()
export class ProcessRefundService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly auditRepository: Repository<OrderStatusHistoryEntity>,
    private readonly paymentDomainService: PaymentDomainService,
    private readonly recordPaymentEventService: RecordPaymentEventService,
  ) {}

  async execute(id: string, tenantId: string, actor: string = 'System'): Promise<RefundEntity> {
    const refund = await this.refundRepository.findOne({
      where: { id, tenantId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== RefundStatusEnum.REQUESTED) {
      throw new BadRequestException(`Cannot process refund from status ${refund.status}`);
    }

    // Set to processing
    refund.status = RefundStatusEnum.PROCESSING;
    await this.refundRepository.save(refund);

    // MOCK GATEWAY INTEGRATION
    // In a real application, you'd call a provider like SSLCommerz here.
    // For demonstration, we simulate success.
    const mockGatewaySuccess = true;

    const order = await this.orderRepository.findOne({ where: { id: refund.orderId, tenantId } });

    if (mockGatewaySuccess) {
      refund.status = RefundStatusEnum.COMPLETED;
      refund.completedAt = new Date();
      refund.gatewayRefundId = `GW-REF-${Math.floor(100000 + Math.random() * 900000)}`;
      await this.refundRepository.save(refund);

      // Keep the payment's refunded total in step with the refunds that
      // actually completed. The dashboard reads payments.refundedAmount, so
      // deriving it here (rather than re-summing refund rows per request) is
      // what keeps refunded figures correct and never double-counted.
      const payment = await this.paymentRepository.findOne({
        where: { id: refund.paymentId, tenantId },
      });

      if (payment) {
        const completedRefunds = await this.refundRepository.find({
          where: { paymentId: payment.id, tenantId, status: RefundStatusEnum.COMPLETED },
        });
        const totalPaymentRefunded = completedRefunds.reduce(
          (sum, r) => sum + Number(r.amount),
          0,
        );

        payment.refundedAmount = Math.min(totalPaymentRefunded, Number(payment.amount));
        payment.status = this.paymentDomainService.resolveSettledStatus(
          Number(payment.amount),
          payment.refundedAmount,
        );
        await this.paymentRepository.save(payment);

        await this.recordPaymentEventService.execute({
          tenantId,
          paymentId: payment.id,
          type: PaymentEventTypeEnum.REFUND_COMPLETED,
          message: `Refund ${refund.refundNumber} of ${refund.amount} ${refund.currency} completed`,
        });
      }

      // Check if order payment status should be updated
      if (order) {
        // Find total refunded
        const existingRefunds = await this.refundRepository.find({
          where: { orderId: order.id, tenantId, status: RefundStatusEnum.COMPLETED },
        });

        const totalRefunded = existingRefunds.reduce((sum, r) => sum + Number(r.amount), 0);

        if (totalRefunded >= Number(order.grandTotal)) {
          order.paymentStatus = PaymentStatusEnum.REFUNDED;
          await this.orderRepository.save(order);
        }
      }
    } else {
      refund.status = RefundStatusEnum.FAILED;
      refund.failureReason = 'Gateway declined refund request';
      await this.refundRepository.save(refund);

      await this.recordPaymentEventService.execute({
        tenantId,
        paymentId: refund.paymentId,
        type: PaymentEventTypeEnum.REFUND_FAILED,
        message: `Refund ${refund.refundNumber} declined by gateway`,
      });
    }

    // Audit log
    await this.auditRepository.save(this.auditRepository.create({
      orderId: refund.orderId,
      newStatus: order?.orderStatus,
      changedBy: actor,
      reason: `Refund ${refund.refundNumber} transitioned to ${refund.status} for ${refund.amount} ${refund.currency}`,
      tenantId,
    }));

    return refund;
  }
}
