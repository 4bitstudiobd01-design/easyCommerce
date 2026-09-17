import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { PathaoAuthService } from './pathao-auth.service';
import { PathaoAreaDto, PathaoCityDto, PathaoZoneDto } from '../dto/pathao-location.dto';
import { throwCourierError } from '../adapters/courier-error.util';

const PATHAO_PRODUCTION_URL = 'https://api-hermes.pathao.com';
const PATHAO_SANDBOX_URL = 'https://courier-api-sandbox.pathao.com';

/** City/zone/area lists change rarely — PATHAO_INTEGRATION_SPEC §4 suggests a ~24h TTL. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Pathao location lookups (city → zone → area) — PATHAO_INTEGRATION_SPEC §4.
 *
 * Used for cascading address dropdowns and required for `price-plan` /
 * `stores` accuracy. These lists are the same for every merchant (they
 * describe Pathao's own coverage, not a merchant's account), so results are
 * cached process-wide keyed by city_id/zone_id rather than per tenant — city
 * list itself has no key at all.
 *
 * An in-memory Map is used rather than Redis: Redis is not wired into this
 * codebase yet (see resolve-courier-credentials.service.ts's own token cache
 * for the DB-backed equivalent used where per-tenant state must survive a
 * restart), and this dataset is small (hundreds of rows) and safe to refetch
 * once per process lifetime / TTL expiry. A specific tenant's saved Pathao
 * credentials are still needed to authenticate the lookup call itself, so a
 * `tenantId` is required even though the cached result is shared.
 */
@Injectable()
export class PathaoLocationService {
  private readonly logger = new Logger(PathaoLocationService.name);
  private readonly cityCache = new Map<string, CacheEntry<PathaoCityDto[]>>();
  private readonly zoneCache = new Map<number, CacheEntry<PathaoZoneDto[]>>();
  private readonly areaCache = new Map<number, CacheEntry<PathaoAreaDto[]>>();

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

  private async authContext(
    tenantId: string,
    store: StoreEntity | null,
  ): Promise<{ baseUrl: string; token: string }> {
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
        'Connect Pathao with a client id, client secret, username and password before looking up delivery areas.',
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

    return { baseUrl, token };
  }

  private fresh<T>(entry: CacheEntry<T> | undefined): T | null {
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.value;
  }

  async listCities(tenantId: string, store: StoreEntity | null): Promise<PathaoCityDto[]> {
    // One shared cache slot — the city list carries no per-merchant variation.
    const cached = this.fresh(this.cityCache.get('all'));
    if (cached) return cached;

    const { baseUrl, token } = await this.authContext(tenantId, store);

    try {
      const res = await axios.get(`${baseUrl}/aladdin/api/v1/city-list`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const rows: any[] = res.data?.data?.data ?? res.data?.data ?? [];
      const cities = rows.map((row) => ({
        cityId: Number(row.city_id),
        cityName: row.city_name,
      }));

      this.cityCache.set('all', { value: cities, expiresAt: Date.now() + CACHE_TTL_MS });
      return cities;
    } catch (err) {
      this.logger.error(`Pathao city list fetch failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('Pathao', err);
    }
  }

  async listZones(
    tenantId: string,
    store: StoreEntity | null,
    cityId: number,
  ): Promise<PathaoZoneDto[]> {
    const cached = this.fresh(this.zoneCache.get(cityId));
    if (cached) return cached;

    const { baseUrl, token } = await this.authContext(tenantId, store);

    try {
      const res = await axios.get(`${baseUrl}/aladdin/api/v1/cities/${cityId}/zone-list`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const rows: any[] = res.data?.data?.data ?? res.data?.data ?? [];
      const zones = rows.map((row) => ({
        zoneId: Number(row.zone_id),
        zoneName: row.zone_name,
      }));

      this.zoneCache.set(cityId, { value: zones, expiresAt: Date.now() + CACHE_TTL_MS });
      return zones;
    } catch (err) {
      this.logger.error(
        `Pathao zone list fetch failed for tenant ${tenantId}, city ${cityId}: ${err?.message}`,
      );
      throwCourierError('Pathao', err);
    }
  }

  async listAreas(
    tenantId: string,
    store: StoreEntity | null,
    zoneId: number,
  ): Promise<PathaoAreaDto[]> {
    const cached = this.fresh(this.areaCache.get(zoneId));
    if (cached) return cached;

    const { baseUrl, token } = await this.authContext(tenantId, store);

    try {
      const res = await axios.get(`${baseUrl}/aladdin/api/v1/zones/${zoneId}/area-list`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      const rows: any[] = res.data?.data?.data ?? res.data?.data ?? [];
      const areas = rows.map((row) => ({
        areaId: Number(row.area_id),
        areaName: row.area_name,
        homeDeliveryAvailable: Boolean(row.home_delivery_available),
        pickupAvailable: Boolean(row.pickup_available),
      }));

      this.areaCache.set(zoneId, { value: areas, expiresAt: Date.now() + CACHE_TTL_MS });
      return areas;
    } catch (err) {
      this.logger.error(
        `Pathao area list fetch failed for tenant ${tenantId}, zone ${zoneId}: ${err?.message}`,
      );
      throwCourierError('Pathao', err);
    }
  }
}
