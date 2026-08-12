import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity, PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../../order/entities/order.entity';
import { ConfigService } from '@nestjs/config';
import { SslCommerzCallbackDto } from '../dto/sslcommerz-callback.dto';
import axios from 'axios';

@Injectable()
export class ValidateSslCommerzPaymentService {
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
          );
          if (res.data?.status === 'VALID' || res.data?.status === 'VALIDATED') {
            isValidated = true;
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
        const order = await this.orderRepository.findOne({ where: { id: payment.orderId } });
        if (order) {
          order.paymentStatus = PaymentStatusEnum.PAID;
          order.orderStatus = OrderStatusEnum.CONFIRMED;
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
