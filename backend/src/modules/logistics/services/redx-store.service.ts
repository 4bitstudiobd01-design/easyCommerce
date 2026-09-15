import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { CreateRedxStoreDto, RedxStoreDto } from '../dto/redx-store.dto';
import { throwCourierError } from '../adapters/courier-error.util';

const REDX_PRODUCTION_URL = 'https://openapi.redx.com.bd/v1.0.0-beta';
const REDX_SANDBOX_URL = 'https://sandbox.redx.com.bd/v1.0.0-beta';

/**
 * RedX pickup-store management — REDX_OpenAPI_Integration_Spec.md §3.8-§3.10.
 *
 * A pickup store is created once per merchant location and its id is then
 * used as `pickup_store_id` when creating a parcel. This service lets a
 * merchant create/list/inspect RedX pickup stores from BitCommerce instead of
 * doing it by hand in RedX's own dashboard.
 */
@Injectable()
export class RedxStoreService {
  private readonly logger = new Logger(RedxStoreService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly resolveCourierCredentials: ResolveCourierCredentialsService,
  ) {}

  private resolveBaseUrl(sandbox: boolean): string {
    const override = this.configService.get<string>('REDX_BASE_URL');
    if (override) return override.replace(/\/+$/, '');
    return sandbox ? REDX_SANDBOX_URL : REDX_PRODUCTION_URL;
  }

  private async resolveToken(
    tenantId: string,
    store: StoreEntity | null,
  ): Promise<{ baseUrl: string; token: string }> {
    const credentials = await this.resolveCourierCredentials.execute(
      tenantId,
      CourierProviderEnum.REDX,
      store,
    );

    const token = credentials.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');
    if (!token) {
      throw new BadRequestException(
        'Connect RedX with an API access token before managing pickup stores.',
      );
    }

    return { baseUrl: this.resolveBaseUrl(Boolean(credentials.sandbox)), token };
  }

  private mapStore(row: any): RedxStoreDto {
    return {
      id: Number(row.id),
      name: row.name,
      address: row.address,
      areaName: row.area_name,
      areaId: Number(row.area_id),
      phone: row.phone,
      createdAt: row.created_at,
    };
  }

  async createStore(
    tenantId: string,
    store: StoreEntity | null,
    dto: CreateRedxStoreDto,
  ): Promise<RedxStoreDto> {
    const { baseUrl, token } = await this.resolveToken(tenantId, store);

    try {
      const res = await axios.post(
        `${baseUrl}/pickup/store`,
        {
          name: dto.name,
          phone: dto.phone,
          address: dto.address,
          area_id: dto.areaId,
        },
        {
          headers: { 'API-ACCESS-TOKEN': `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      return this.mapStore(res.data);
    } catch (err) {
      this.logger.error(`RedX pickup store creation failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('RedX', err);
    }
  }

  async listStores(tenantId: string, store: StoreEntity | null): Promise<RedxStoreDto[]> {
    const { baseUrl, token } = await this.resolveToken(tenantId, store);

    try {
      const res = await axios.get(`${baseUrl}/pickup/stores`, {
        headers: { 'API-ACCESS-TOKEN': `Bearer ${token}` },
        timeout: 10000,
      });

      const rows: any[] = res.data?.pickup_stores ?? [];
      return rows.map((row) => this.mapStore(row));
    } catch (err) {
      this.logger.error(`RedX pickup store list failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('RedX', err);
    }
  }

  async getStore(
    tenantId: string,
    store: StoreEntity | null,
    pickupStoreId: number,
  ): Promise<RedxStoreDto> {
    const { baseUrl, token } = await this.resolveToken(tenantId, store);

    try {
      const res = await axios.get(`${baseUrl}/pickup/store/info/${pickupStoreId}`, {
        headers: { 'API-ACCESS-TOKEN': `Bearer ${token}` },
        timeout: 10000,
      });

      const row = res.data?.pickup_store;
      if (!row) {
        throw new BadRequestException(`RedX pickup store ${pickupStoreId} was not found.`);
      }
      return this.mapStore(row);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(
        `RedX pickup store info fetch failed for tenant ${tenantId}, store ${pickupStoreId}: ${err?.message}`,
      );
      throwCourierError('RedX', err);
    }
  }
}
