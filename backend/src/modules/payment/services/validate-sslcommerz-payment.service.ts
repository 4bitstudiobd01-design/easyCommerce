import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../../order/entities/order.entity';
import { ConfigService } from '@nestjs/config';
import { SslCommerzCallbackDto } from '../dto/sslcommerz-callback.dto';
import axios from 'axios';

@Injectable()
export class ValidateSslCommerzPaymentService {
  private readonly logger = new Logger(ValidateSslCommerzPaymentService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: SslCommerzCallbackDto): Promise<{ success: boolean; orderNumber?: string }> {
    if (!dto.tran_id) {
      return { success: false };
    }

    const payment = await this.paymentRepository.findOne({
      where: { tranId: dto.tran_id },
    });

    if (!payment) {
      return { success: false };
    }

    if (payment.status !== PaymentTransactionStatusEnum.PENDING) {
      // Already processed (or already failed) — do not re-process a terminal payment.
      return { success: false };
    }

    const statusUpper = (dto.status || '').toUpperCase();

    if (statusUpper === 'VALID' || statusUpper === 'VALIDATED' || statusUpper === 'SUCCESS') {
      const storeId =
        this.configService.get<string>('SSL_STORE_ID') ||
        this.configService.get<string>('SSLCOMMERZ_STORE_ID', 'testbox');
      const storePass =
        this.configService.get<string>('SSL_STORE_PASSWORD') ||
        this.configService.get<string>('SSLCOMMERZ_STORE_PASSWORD', 'qwerty');
      const isSandbox =
        this.configService.get<string>('SSL_IS_SANDBOX', 'true') === 'true';
      const isLive =
        !isSandbox &&
        this.configService.get<string>('SSLCOMMERZ_IS_LIVE', 'false') === 'true';

      const validationUrl = isLive
        ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
        : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

      // Fail closed: a payment is only considered valid if SSLCommerz's
      // server-to-server validation API explicitly confirms it.
      let isValidated = false;

      if (dto.val_id) {
        try {
          const res = await axios.get(
            `${validationUrl}?val_id=${dto.val_id}&store_id=${storeId}&store_passwd=${storePass}&format=json`,
            { timeout: 10000 },
          );

          const gatewayStatus = res.data?.status;
          const isStatusValid = gatewayStatus === 'VALID' || gatewayStatus === 'VALIDATED';

          // The gateway's own response is the authority on how much was actually paid —
          // never the (spoofable) IPN body. Underpaying must not mark an order PAID.
          const paidAmount = Number(res.data?.amount);
          const expectedAmount = Number(payment.amount);
          const isAmountValid =
            Number.isFinite(paidAmount) &&
            Number.isFinite(expectedAmount) &&
            Math.abs(paidAmount - expectedAmount) < 0.01;

          if (isStatusValid && isAmountValid) {
            isValidated = true;
          } else if (isStatusValid && !isAmountValid) {
            this.logger.error(
              `SSLCommerz amount mismatch for tran_id ${dto.tran_id}: gateway reported ${res.data?.amount}, expected ${payment.amount}. Rejecting.`,
            );
          }
        } catch (err) {
          // Validation API call failed — treat as not validated rather than trusting the callback.
        }
      }

      if (isValidated) {
        payment.status = PaymentTransactionStatusEnum.COMPLETED;
        payment.valId = dto.val_id;
        payment.cardType = dto.card_type;
        payment.bankTranId = dto.bank_tran_id;
        await this.paymentRepository.save(payment);

        // Update Order Status
        const order = await this.orderRepository.findOne({
          where: { id: payment.orderId, tenantId: payment.tenantId },
        });
        if (order) {
          order.paymentStatus = PaymentStatusEnum.PAID;

          // Record the payment, but never resurrect an order that has already left the
          // pending state — a late IPN on a cancelled order is a refund case, not a
          // confirmation. Advancing it here would bypass the order state machine.
          if (order.orderStatus === OrderStatusEnum.PENDING) {
            order.orderStatus = OrderStatusEnum.CONFIRMED;
          } else if (order.orderStatus !== OrderStatusEnum.CONFIRMED) {
            this.logger.warn(
              `Payment ${dto.tran_id} validated for order ${order.orderNumber} in status ${order.orderStatus}; recording payment without changing order status.`,
            );
          }

          await this.orderRepository.save(order);
          return { success: true, orderNumber: order.orderNumber };
        }
      }
    }

    payment.status = PaymentTransactionStatusEnum.FAILED;
    await this.paymentRepository.save(payment);
    return { success: false };
  }
}
