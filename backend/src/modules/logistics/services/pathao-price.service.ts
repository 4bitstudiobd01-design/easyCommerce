import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { PathaoAuthService } from './pathao-auth.service';
import { CalculatePathaoPriceDto, PathaoPriceDto } from '../dto/pathao-price.dto';
import { throwCourierError } from '../adapters/courier-error.util';

const PATHAO_PRODUCTION_URL = 'https://api-hermes.pathao.com';
const PATHAO_SANDBOX_URL = 'https://courier-api-sandbox.pathao.com';

/**
 * Pathao delivery price calculation — PATHAO_INTEGRATION_SPEC §6.
 *
 * Called before order creation so the customer/admin sees the real delivery
 * fee (`final_price`) rather than a flat estimate. Never cached: price depends
 * on the merchant's store, the recipient's city/zone and the parcel weight,
 * all of which vary per call.
 */
@Injectable()
export class PathaoPriceService {
  private readonly logger = new Logger(PathaoPriceService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly resolveCourierCredentials: ResolveCourierCredentialsService,
    private readonly pathaoAuth: PathaoAuthService,
  ) {}

  private resolveBaseUrl(sandbox: boolean): string {
    const override = this.configService.get<string>('PATHAO_BASE_URL');
    if (override) return override.replace(/\/+$/, '');
    return sandbox ? PATHAO_SANDBOX_URL : PATHAO_PRODUCTION_URL;
  }

  async calculatePrice(
    tenantId: string,
    store: StoreEntity | null,
    dto: CalculatePathaoPriceDto,
  ): Promise<PathaoPriceDto> {
    const credentials = await this.resolveCourierCredentials.execute(
      tenantId,
      CourierProviderEnum.PATHAO,
      store,
    );

    const clientId = credentials.clientId || this.configService.get<string>('PATHAO_CLIENT_ID');
    const clientSecret =
      credentials.clientSecret || this.configService.get<string>('PATHAO_CLIENT_SECRET');
    const username = credentials.username || this.configService.get<string>('PATHAO_USERNAME');
    const password = credentials.password || this.configService.get<string>('PATHAO_PASSWORD');

    if (!clientId || !clientSecret || !username || !password) {
      throw new BadRequestException(
        'Connect Pathao with a client id, client secret, username and password before calculating a delivery price.',
      );
    }

    const sandbox = Boolean(credentials.sandbox);
    const baseUrl = this.resolveBaseUrl(sandbox);
    const token = await this.pathaoAuth.getValidAccessToken(tenantId, baseUrl, sandbox, {
      clientId,
      clientSecret,
      username,
      password,
    });

    try {
      const res = await axios.post(
        `${baseUrl}/aladdin/api/v1/merchant/price-plan`,
        {
          store_id: dto.storeId,
          item_type: dto.itemType,
          delivery_type: dto.deliveryType,
          item_weight: dto.itemWeight,
          recipient_city: dto.recipientCity,
          recipient_zone: dto.recipientZone,
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      const data = res.data?.data;
      if (!data || typeof data.final_price === 'undefined') {
        this.logger.error(
          `Pathao price-plan returned no price for tenant ${tenantId}: ${JSON.stringify(res.data)}`,
        );
        throw new BadRequestException('Pathao could not calculate a delivery price for this route.');
      }

      return {
        price: Number(data.price),
        discount: Number(data.discount ?? 0),
        promoDiscount: Number(data.promo_discount ?? 0),
        planId: Number(data.plan_id),
        codEnabled: Boolean(data.cod_enabled),
        codPercentage: Number(data.cod_percentage ?? 0),
        additionalCharge: Number(data.additional_charge ?? 0),
        finalPrice: Number(data.final_price),
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Pathao price-plan request failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('Pathao', err);
    }
  }
}
