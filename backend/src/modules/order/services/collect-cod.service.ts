import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, PaymentMethodEnum, PaymentStatusEnum } from '../entities/order.entity';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../../payment/entities/payment.entity';

@Injectable()
export class CollectCodService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly orderStatusHistoryRepository: Repository<OrderStatusHistoryEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async execute(orderId: string, tenantId: string, userId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (order.paymentMethod !== PaymentMethodEnum.COD) {
      throw new BadRequestException('This order is not configured for Cash on Delivery.');
    }

    if (order.paymentStatus === PaymentStatusEnum.COD_COLLECTED) {
      throw new BadRequestException('COD for this order has already been collected.');
    }

    if (order.paymentStatus !== PaymentStatusEnum.COD_PENDING) {
      throw new BadRequestException(`Cannot collect COD from payment status: ${order.paymentStatus}`);
    }

    order.paymentStatus = PaymentStatusEnum.COD_COLLECTED;
    const updatedOrder = await this.orderRepository.save(order);

    // Create a Payment transaction record
    const tranId = `COD-${order.orderNumber}-${Date.now()}`;
    const paymentRecord = this.paymentRepository.create({
      orderId: order.id,
      orderNumber: order.orderNumber,
      tranId,
      amount: Number(order.grandTotal),
      currency: 'BDT',
      status: PaymentTransactionStatusEnum.COMPLETED,
      tenantId,
    });
    await this.paymentRepository.save(paymentRecord);

    // Create audit history log
    const history = this.orderStatusHistoryRepository.create({
      orderId: order.id,
      previousStatus: order.orderStatus,
      newStatus: order.orderStatus,
      changedBy: userId,
      reason: `COD marked as collected manually. Amount: ৳${order.grandTotal}`,
      tenantId,
    });
    await this.orderStatusHistoryRepository.save(history);

    return updatedOrder;
  }
}
