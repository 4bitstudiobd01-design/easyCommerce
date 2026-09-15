import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { CalculateRedxChargeDto, RedxChargeDto } from '../dto/redx-charge.dto';
import { throwCourierError } from '../adapters/courier-error.util';

const REDX_PRODUCTION_URL = 'https://openapi.redx.com.bd/v1.0.0-beta';
const REDX_SANDBOX_URL = 'https://sandbox.redx.com.bd/v1.0.0-beta';

/**
 * RedX delivery-charge calculation — REDX_OpenAPI_Integration_Spec.md §3.11.
 *
 * Called before Create Parcel so the customer/admin sees the real delivery +
 * COD charge rather than a flat estimate. Never cached: the charge depends on
 * the specific pickup/delivery area pair, weight and COD amount, all of which
 * vary per call.
 */
@Injectable()
export class RedxChargeService {
  private readonly logger = new Logger(RedxChargeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly resolveCourierCredentials: ResolveCourierCredentialsService,
  ) {}

  private resolveBaseUrl(sandbox: boolean): string {
    const override = this.configService.get<string>('REDX_BASE_URL');
    if (override) return override.replace(/\/+$/, '');
    return sandbox ? REDX_SANDBOX_URL : REDX_PRODUCTION_URL;
  }

  async calculateCharge(
    tenantId: string,
    store: StoreEntity | null,
    dto: CalculateRedxChargeDto,
  ): Promise<RedxChargeDto> {
    const credentials = await this.resolveCourierCredentials.execute(
      tenantId,
      CourierProviderEnum.REDX,
      store,
    );

    const token = credentials.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');
    if (!token) {
      throw new BadRequestException(
        'Connect RedX with an API access token before calculating a delivery charge.',
      );
    }

    const baseUrl = this.resolveBaseUrl(Boolean(credentials.sandbox));

    try {
      const res = await axios.get(`${baseUrl}/charge/charge_calculator`, {
        headers: { 'API-ACCESS-TOKEN': `Bearer ${token}` },
        params: {
          delivery_area_id: dto.deliveryAreaId,
          pickup_area_id: dto.pickupAreaId,
          cash_collection_amount: dto.cashCollectionAmount,
          weight: dto.weight,
        },
        timeout: 10000,
      });

      if (typeof res.data?.deliveryCharge === 'undefined') {
        this.logger.error(
          `RedX charge_calculator returned no charge for tenant ${tenantId}: ${JSON.stringify(res.data)}`,
        );
        throw new BadRequestException('RedX could not calculate a delivery charge for this route.');
      }

      return {
        deliveryCharge: Number(res.data.deliveryCharge),
        codCharge: Number(res.data.codCharge ?? 0),
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`RedX charge_calculator request failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('RedX', err);
    }
  }
}
