import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { PathaoAuthService } from './pathao-auth.service';
import { CreatePathaoStoreDto, CreatePathaoStoreResponseDto, PathaoStoreDto } from '../dto/pathao-store.dto';
import { throwCourierError } from '../adapters/courier-error.util';

const PATHAO_PRODUCTION_URL = 'https://api-hermes.pathao.com';
const PATHAO_SANDBOX_URL = 'https://courier-api-sandbox.pathao.com';

/**
 * Pathao "Store" (pickup point) management — PATHAO_INTEGRATION_SPEC §5.
 *
 * A store is created once per merchant and its `store_id` is then reused for
 * every order (entered as the `merchantStoreId` credential field). This
 * service exists so a merchant can create/list Pathao stores from BitCommerce
 * instead of doing it by hand in Pathao's own panel and copying an id in.
 *
 * Pathao's own note: a newly created store needs ~1 hour of manual approval on
 * their side before it can be used to book orders — this service surfaces
 * that message as-is rather than hiding it.
 */
@Injectable()
export class PathaoStoreService {
  private readonly logger = new Logger(PathaoStoreService.name);

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

  /** Resolves the tenant's saved Pathao credentials and a bearer token, or throws a merchant-readable error. */
  private async authContext(
    tenantId: string,
    store: StoreEntity | null,
  ): Promise<{ baseUrl: string; sandbox: boolean; token: string }> {
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
        'Connect Pathao with a client id, client secret, username and password before managing stores.',
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

    return { baseUrl, sandbox, token };
  }

  async createStore(
    tenantId: string,
    store: StoreEntity | null,
    dto: CreatePathaoStoreDto,
  ): Promise<CreatePathaoStoreResponseDto> {
    const { baseUrl, token } = await this.authContext(tenantId, store);

    try {
      const res = await axios.post(
        `${baseUrl}/aladdin/api/v1/stores`,
        {
          name: dto.name,
          contact_name: dto.contactName,
          contact_number: dto.contactNumber,
          secondary_contact: dto.secondaryContact,
          otp_number: dto.otpNumber,
          address: dto.address,
          city_id: dto.cityId,
          zone_id: dto.zoneId,
          area_id: dto.areaId,
        },
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      );

      return {
        message:
          res.data?.message ??
          'Store created successfully, please wait about one hour for Pathao to approve it.',
        storeName: res.data?.data?.store_name ?? dto.name,
      };
    } catch (err) {
      this.logger.error(`Pathao store creation failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('Pathao', err);
    }
  }

  async listStores(tenantId: string, store: StoreEntity | null): Promise<PathaoStoreDto[]> {
    const { baseUrl, token } = await this.authContext(tenantId, store);

    try {
      const res = await axios.get(`${baseUrl}/aladdin/api/v1/stores`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const rows: any[] = res.data?.data?.data ?? res.data?.data ?? [];
      return rows.map((row) => ({
        storeId: Number(row.store_id),
        storeName: row.store_name,
        storeAddress: row.store_address,
        isActive: Boolean(row.is_active),
        cityId: Number(row.city_id),
        zoneId: Number(row.zone_id),
        hubId: row.hub_id != null ? Number(row.hub_id) : undefined,
        isDefaultStore: Boolean(row.is_default_store),
        isDefaultReturnStore: Boolean(row.is_default_return_store),
      }));
    } catch (err) {
      this.logger.error(`Pathao store list failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('Pathao', err);
    }
  }
}
