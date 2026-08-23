import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, PaymentMethodEnum, PaymentStatusEnum } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../../payment/entities/payment.entity';

@Injectable()
export class UndoCollectCodService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async execute(orderId: string, tenantId: string, userId: string, reason: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (order.paymentMethod !== PaymentMethodEnum.COD) {
      throw new BadRequestException('This order is not configured for Cash on Delivery.');
    }

    if (order.paymentStatus !== PaymentStatusEnum.COD_COLLECTED) {
      throw new BadRequestException(`Cannot undo collection from payment status: ${order.paymentStatus}`);
    }

    order.paymentStatus = PaymentStatusEnum.COD_PENDING;
    const updatedOrder = await this.orderRepository.save(order);

    // Void the payment record created at collection time rather than deleting it,
    // so the reversal stays visible in the payment history.
    const collectionPayment = await this.paymentRepository.findOne({
      where: { orderId: order.id, tenantId, status: PaymentTransactionStatusEnum.COMPLETED },
      order: { createdAt: 'DESC' },
    });
    if (collectionPayment) {
      collectionPayment.status = PaymentTransactionStatusEnum.CANCELLED;
      await this.paymentRepository.save(collectionPayment);
    }

    const history = this.orderStatusHistoryRepository.create({
      orderId: order.id,
      previousStatus: order.orderStatus,
      newStatus: order.orderStatus,
      changedBy: userId,
      reason: `COD collection undone: ${reason}`,
      tenantId,
    });
    await this.orderStatusHistoryRepository.save(history);

    return updatedOrder;
  }
}
