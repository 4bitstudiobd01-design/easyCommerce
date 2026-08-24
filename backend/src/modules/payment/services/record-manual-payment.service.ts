import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { OrderEntity, PaymentStatusEnum, PaymentMethodEnum } from '../../order/entities/order.entity';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';
import { RecordManualPaymentDto, ManualPaymentMethodEnum } from '../dto/record-manual-payment.dto';
import { RecordPaymentEventService } from './record-payment-event.service';
import { GetOrderBalanceService } from './get-order-balance.service';

/** Manual methods map 1:1 onto PaymentMethodTypeEnum except CASH/OTHER, which the canonical enum has no slot for. */
function toPaymentMethod(method: ManualPaymentMethodEnum): PaymentMethodTypeEnum {
  switch (method) {
    case ManualPaymentMethodEnum.BKASH:
      return PaymentMethodTypeEnum.BKASH;
    case ManualPaymentMethodEnum.NAGAD:
      return PaymentMethodTypeEnum.NAGAD;
    case ManualPaymentMethodEnum.ROCKET:
      return PaymentMethodTypeEnum.ROCKET;
    case ManualPaymentMethodEnum.BANK_TRANSFER:
      return PaymentMethodTypeEnum.BANK_TRANSFER;
    default:
      // CASH / OTHER have no canonical PaymentMethodTypeEnum slot; CARD is the
      // closest "generic in-person/offline" fallback used elsewhere for unknowns.
      return PaymentMethodTypeEnum.CARD;
  }
}

@Injectable()
export class RecordManualPaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly recordPaymentEventService: RecordPaymentEventService,
    private readonly getOrderBalanceService: GetOrderBalanceService,
  ) {}

  async execute(tenantId: string, orderId: string, dto: RecordManualPaymentDto): Promise<PaymentEntity> {
    const order = await this.orderRepository.findOne({ where: { id: orderId, tenantId } });
    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    const { balanceDue } = await this.getOrderBalanceService.execute(tenantId, orderId);
    if (dto.amount > balanceDue) {
      throw new BadRequestException(
        `Amount ৳${dto.amount} exceeds the current balance due of ৳${balanceDue}.`,
      );
    }

    const payment = await this.dataSource.transaction(async (manager) => {
      const tranId = `MANUAL-${order.orderNumber}-${Date.now().toString().slice(-6)}`;

      const created = manager.create(PaymentEntity, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        tranId,
        amount: dto.amount,
        currency: 'BDT',
        gateway: PaymentGatewayEnum.MANUAL,
        paymentMethod: toPaymentMethod(dto.method),
        status: PaymentTransactionStatusEnum.COMPLETED,
        paidAt: new Date(),
        tenantId,
      });
      const savedPayment = await manager.save(created);

      const totalPaidSoFar = Number(order.grandTotal) - balanceDue + dto.amount;
      const isFullyPaid = totalPaidSoFar >= Number(order.grandTotal);
      // A COD order settles as COD_COLLECTED, not PAID — PAID implies an online
      // payment, and COD_COLLECTED is what the rest of the order flow (delivery
      // auto-transition, the collect/undo-collect actions) checks for.
      const nextPaymentStatus = isFullyPaid
        ? order.paymentMethod === PaymentMethodEnum.COD
          ? PaymentStatusEnum.COD_COLLECTED
          : PaymentStatusEnum.PAID
        : PaymentStatusEnum.PARTIALLY_PAID;

      await manager.update(OrderEntity, { id: order.id }, { paymentStatus: nextPaymentStatus });

      return savedPayment;
    });

    await this.recordPaymentEventService.execute({
      tenantId,
      paymentId: payment.id,
      type: PaymentEventTypeEnum.PAYMENT_SUCCEEDED,
      message: `Manual payment of ৳${dto.amount} recorded (${dto.method})${dto.note ? `: ${dto.note}` : ''}`,
    });

    return payment;
  }
}
