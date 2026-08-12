import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SubscriptionInvoiceEntity, InvoiceStatusEnum } from '../entities/subscription-invoice.entity';
import { SubscriptionEntity, SubscriptionStatusEnum } from '../entities/subscription.entity';

export interface ValidatePlanPaymentResult {
  success: boolean;
  planName?: string;
}

@Injectable()
export class ValidatePlanRenewalPaymentService {
  constructor(
    @InjectRepository(SubscriptionInvoiceEntity)
    private readonly invoiceRepository: Repository<SubscriptionInvoiceEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    private readonly configService: ConfigService,
  ) {}

  async execute(invoiceId: string, valId?: string): Promise<ValidatePlanPaymentResult> {
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });

    if (!invoice || invoice.status !== InvoiceStatusEnum.PENDING) {
      return { success: false };
    }

    const isValidated = await this.verifySslCommerzPayment(valId);

    if (!isValidated) {
      invoice.status = InvoiceStatusEnum.FAILED;
      await this.invoiceRepository.save(invoice);
      return { success: false };
    }

    invoice.status = InvoiceStatusEnum.PAID;
    invoice.valId = valId;
    await this.invoiceRepository.save(invoice);

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: invoice.subscriptionId },
    });

    if (subscription) {
      subscription.planId = invoice.planId;
      subscription.status = SubscriptionStatusEnum.ACTIVE;
      subscription.currentPeriodStart = invoice.periodStart;
      subscription.currentPeriodEnd = invoice.periodEnd;
      subscription.gracePeriodEndsAt = null;
      await this.subscriptionRepository.save(subscription);
    }

    return { success: true };
  }

  private async verifySslCommerzPayment(valId?: string): Promise<boolean> {
    if (!valId) {
      return false;
    }

    const storeIdKey =
      this.configService.get<string>('SSL_STORE_ID') ||
      this.configService.get<string>('SSLCOMMERZ_STORE_ID', 'testbox');
    const storePass =
      this.configService.get<string>('SSL_STORE_PASSWORD') ||
      this.configService.get<string>('SSLCOMMERZ_STORE_PASSWORD', 'qwerty');
    const isSandbox = this.configService.get<string>('SSL_IS_SANDBOX', 'true') === 'true';
    const isLive =
      !isSandbox && this.configService.get<string>('SSLCOMMERZ_IS_LIVE', 'false') === 'true';

    const validationUrl = isLive
      ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
      : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php';

    try {
      const res = await axios.get(
        `${validationUrl}?val_id=${valId}&store_id=${storeIdKey}&store_passwd=${storePass}&format=json`,
      );
      return res.data?.status === 'VALID' || res.data?.status === 'VALIDATED';
    } catch (err) {
      return false;
    }
  }
}
