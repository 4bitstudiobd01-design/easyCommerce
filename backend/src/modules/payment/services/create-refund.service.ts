import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefundEntity, RefundStatusEnum } from '../entities/refund.entity';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { OrderEntity, PaymentMethodEnum, PaymentStatusEnum } from '../../order/entities/order.entity';
import { CreateRefundDto } from '../dto/create-refund.dto';

@Injectable()
export class CreateRefundService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async execute(dto: CreateRefundDto, tenantId: string): Promise<RefundEntity> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Must have a completed payment to refund
    if (order.paymentStatus === PaymentStatusEnum.UNPAID || order.paymentStatus === PaymentStatusEnum.COD_PENDING || order.paymentStatus === PaymentStatusEnum.FAILED) {
      throw new BadRequestException('Cannot refund an unpaid order');
    }

    // Find the primary payment transaction
    const payment = await this.paymentRepository.findOne({
      where: { orderId: order.id, tenantId, status: PaymentTransactionStatusEnum.COMPLETED },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new NotFoundException('No completed payment transaction found to refund');
    }

    // Check refund limits
    const existingRefunds = await this.refundRepository.find({
      where: { orderId: order.id, tenantId },
    });

    const totalRefunded = existingRefunds
      .filter(r => r.status !== RefundStatusEnum.FAILED && r.status !== RefundStatusEnum.CANCELLED)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const amountAvailable = Number(payment.amount) - totalRefunded;

    if (dto.amount > amountAvailable) {
      throw new BadRequestException(`Requested refund amount ${dto.amount} exceeds available refundable amount ${amountAvailable}`);
    }

    const refundNumber = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRefund = this.refundRepository.create({
      refundNumber,
      orderId: order.id,
      paymentId: payment.id,
      returnId: dto.returnId,
      amount: dto.amount,
      currency: payment.currency,
      method: order.paymentMethod, // Assuming refund to original method
      status: RefundStatusEnum.REQUESTED,
      reason: dto.reason,
      tenantId,
    });

    return await this.refundRepository.save(newRefund);
  }
}
