import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as querystring from 'querystring';
import { PlanEntity, PlanCodeEnum } from '../entities/plan.entity';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { SubscriptionInvoiceEntity, InvoiceStatusEnum } from '../entities/subscription-invoice.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';

export interface PlanRenewalInitiateResponse {
  isFree: boolean;
  gatewayUrl?: string;
  tranId?: string;
  message?: string;
}

@Injectable()
export class InitiatePlanRenewalPaymentService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionInvoiceEntity)
    private readonly invoiceRepository: Repository<SubscriptionInvoiceEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    tenantId: string,
    planCode: PlanCodeEnum,
    userEmail?: string,
    userName?: string,
  ): Promise<PlanRenewalInitiateResponse> {
    const plan = await this.planRepository.findOne({ where: { code: planCode, isActive: true } });
    if (!plan) {
      throw new NotFoundException('Invalid or inactive plan.');
    }

    if (Number(plan.monthlyPriceBdt) <= 0) {
      throw new BadRequestException('The Free plan does not require payment.');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    let subscription = await this.subscriptionRepository.findOne({ where: { tenantId } });
    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        tenantId,
        planId: plan.id,
        status: 'ACTIVE' as any,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        gracePeriodEndsAt: null,
      });
      subscription = await this.subscriptionRepository.save(subscription);
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

    const sslBaseUrl = isLive
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';

    const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:5001');
    const tranId = `PLAN-${plan.code}-${Date.now().toString().slice(-8)}`;

    const invoice = this.invoiceRepository.create({
      tenantId,
      subscriptionId: subscription.id,
      planId: plan.id,
      amountBdt: plan.monthlyPriceBdt,
      tranId,
      status: InvoiceStatusEnum.PENDING,
      periodStart: now,
      periodEnd,
    });
    await this.invoiceRepository.save(invoice);

    const store = await this.storeRepository.findOne({ where: { tenantId } });

    const postData = {
      store_id: storeIdKey,
      store_passwd: storePass,
      total_amount: plan.monthlyPriceBdt,
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${backendUrl}/api/v1/billing/payment/sslcommerz/success?invoiceId=${invoice.id}`,
      fail_url: `${backendUrl}/api/v1/billing/payment/sslcommerz/fail?invoiceId=${invoice.id}`,
      cancel_url: `${backendUrl}/api/v1/billing/payment/sslcommerz/cancel?invoiceId=${invoice.id}`,
      ipn_url: `${backendUrl}/api/v1/billing/payment/sslcommerz/ipn`,
      cus_name: userName || store?.name || 'Merchant Owner',
      cus_email: userEmail || 'merchant@easycommerce.app',
      cus_add1: store?.address || 'Dhaka, Bangladesh',
      cus_city: 'Dhaka',
      cus_postcode: '1200',
      cus_country: 'Bangladesh',
      cus_phone: store?.phone || '01700000000',
      shipping_method: 'NO',
      product_name: `EasyCommerce Subscription: ${plan.name}`,
      product_category: 'SaaS Subscription',
      product_profile: 'non-physical-goods',
    };

    try {
      const response = await axios.post(
        `${sslBaseUrl}/gwprocess/v4/api.php`,
        querystring.stringify(postData),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const resData = response.data;

      if (resData.status === 'SUCCESS' && resData.GatewayPageURL) {
        return { isFree: false, gatewayUrl: resData.GatewayPageURL, tranId };
      }

      throw new BadRequestException(
        resData.failedreason || 'SSLCommerz payment session initialization failed for subscription renewal.',
      );
    } catch (err: any) {
      throw new BadRequestException(
        err?.response?.data?.failedreason || err.message || 'SSLCommerz gateway connection error.',
      );
    }
  }
}
