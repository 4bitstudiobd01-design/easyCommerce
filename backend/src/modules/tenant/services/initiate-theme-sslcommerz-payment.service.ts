import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';
import { ThemePurchaseEntity } from '../entities/theme-purchase.entity';
import { THEME_CATALOG } from './list-available-themes.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as querystring from 'querystring';

export interface ThemePaymentInitiateResponse {
  isFree: boolean;
  gatewayUrl?: string;
  tranId?: string;
  message?: string;
}

@Injectable()
export class InitiateThemeSslCommerzPaymentService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(ThemePurchaseEntity)
    private readonly purchaseRepository: Repository<ThemePurchaseEntity>,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    themeId: string,
    userEmail?: string,
    userName?: string,
  ): Promise<ThemePaymentInitiateResponse> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found.');
    }

    const themeDef = THEME_CATALOG.find((t) => t.id === themeId);
    if (!themeDef) {
      throw new NotFoundException('Invalid theme ID.');
    }

    const unlockedSet = new Set(store.unlockedThemeIds || ['DEFAULT_MODERN']);

    if (unlockedSet.has(themeId)) {
      store.activeThemeId = themeId;
      await this.storeRepository.save(store);
      return {
        isFree: true,
        message: `Theme "${themeDef.name}" is already unlocked and is now active!`,
      };
    }

    if (themeDef.isFree || themeDef.price <= 0) {
      unlockedSet.add(themeId);
      store.unlockedThemeIds = Array.from(unlockedSet);
      store.activeThemeId = themeId;
      await this.storeRepository.save(store);
      return {
        isFree: true,
        message: `Free theme "${themeDef.name}" unlocked and activated!`,
      };
    }

    // SSLCommerz Credentials
    const storeIdKey =
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

    const sslBaseUrl = isLive
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';

    const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:5001');
    const tranId = `THEME-${themeId.slice(0, 8)}-${Date.now().toString().slice(-6)}`;

    // Create PENDING Theme Purchase Record
    const purchase = this.purchaseRepository.create({
      tenantId,
      storeId,
      themeId,
      tranId,
      price: themeDef.price,
      status: 'PENDING',
      paymentMethod: 'SSLCOMMERZ',
    });
    await this.purchaseRepository.save(purchase);

    const postData = {
      store_id: storeIdKey,
      store_passwd: storePass,
      total_amount: themeDef.price,
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${backendUrl}/api/v1/tenant/themes/payment/sslcommerz/success?purchaseId=${purchase.id}`,
      fail_url: `${backendUrl}/api/v1/tenant/themes/payment/sslcommerz/fail?purchaseId=${purchase.id}`,
      cancel_url: `${backendUrl}/api/v1/tenant/themes/payment/sslcommerz/cancel?purchaseId=${purchase.id}`,
      ipn_url: `${backendUrl}/api/v1/tenant/themes/payment/sslcommerz/ipn?purchaseId=${purchase.id}`,
      cus_name: userName || store.name || 'Merchant Owner',
      cus_email: userEmail || 'merchant@easycommerce.app',
      cus_add1: store.address || 'Dhaka, Bangladesh',
      cus_city: 'Dhaka',
      cus_postcode: '1200',
      cus_country: 'Bangladesh',
      cus_phone: store.phone || '01700000000',
      shipping_method: 'NO',
      product_name: `EasyCommerce Theme: ${themeDef.name}`,
      product_category: 'Digital SaaS Theme License',
      product_profile: 'non-physical-goods',
    };

    try {
      const response = await axios.post(
        `${sslBaseUrl}/gwprocess/v4/api.php`,
        querystring.stringify(postData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const resData = response.data;

      if (resData.status === 'SUCCESS' && resData.GatewayPageURL) {
        return {
          isFree: false,
          gatewayUrl: resData.GatewayPageURL,
          tranId,
        };
      }

      throw new BadRequestException(
        resData.failedreason || 'SSLCommerz payment session initialization failed for theme purchase.',
      );
    } catch (err: any) {
      throw new BadRequestException(
        err?.response?.data?.failedreason || err.message || 'SSLCommerz gateway connection error.',
      );
    }
  }
}
