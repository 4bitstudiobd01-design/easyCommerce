import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CourierProviderEnum } from '../entities/consignment.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ResolveCourierCredentialsService } from './resolve-courier-credentials.service';
import { RedxAreaDto } from '../dto/redx-area.dto';
import { throwCourierError } from '../adapters/courier-error.util';

const REDX_PRODUCTION_URL = 'https://openapi.redx.com.bd/v1.0.0-beta';
const REDX_SANDBOX_URL = 'https://sandbox.redx.com.bd/v1.0.0-beta';

/** REDX_OpenAPI_Integration_Spec.md §9.6 — this is a full, mostly-static national list. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * RedX delivery-area lookups — REDX_OpenAPI_Integration_Spec.md §3.5-§3.7.
 *
 * `/areas` returns RedX's entire national area list with no pagination, and
 * area data changes rarely, so results are cached process-wide (not per
 * tenant — the area list is RedX's own coverage, identical for every
 * merchant) rather than re-fetched on every lookup. Same in-memory-Map
 * approach as PathaoLocationService, for the same reason: Redis is not wired
 * into this codebase yet, and `@nestjs/cache-manager` would be a new
 * dependency for a dataset this small.
 *
 * A tenant's saved RedX credentials are still needed to authenticate the
 * lookup call itself, so `tenantId` is required even though the cached
 * result is shared.
 */
@Injectable()
export class RedxAreaService {
  private readonly logger = new Logger(RedxAreaService.name);
  private readonly allAreasCache = new Map<string, CacheEntry<RedxAreaDto[]>>();

  constructor(
    private readonly configService: ConfigService,
    private readonly resolveCourierCredentials: ResolveCourierCredentialsService,
  ) {}

  private resolveBaseUrl(sandbox: boolean): string {
    const override = this.configService.get<string>('REDX_BASE_URL');
    if (override) return override.replace(/\/+$/, '');
    return sandbox ? REDX_SANDBOX_URL : REDX_PRODUCTION_URL;
  }

  private async resolveToken(tenantId: string, store: StoreEntity | null): Promise<{ baseUrl: string; token: string }> {
    const credentials = await this.resolveCourierCredentials.execute(
      tenantId,
      CourierProviderEnum.REDX,
      store,
    );

    const token = credentials.apiKey || this.configService.get<string>('REDX_ACCESS_TOKEN');
    if (!token) {
      throw new BadRequestException(
        'Connect RedX with an API access token before looking up delivery areas.',
      );
    }

    return { baseUrl: this.resolveBaseUrl(Boolean(credentials.sandbox)), token };
  }

  private mapArea(row: any): RedxAreaDto {
    return {
      id: Number(row.id),
      name: row.name,
      postCode: Number(row.post_code),
      divisionName: row.division_name,
      zoneId: Number(row.zone_id),
    };
  }

  /** The full national list, cached — filter it client-side for postcode/district lookups where possible. */
  async listAllAreas(tenantId: string, store: StoreEntity | null): Promise<RedxAreaDto[]> {
    const cached = this.allAreasCache.get('all');
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const { baseUrl, token } = await this.resolveToken(tenantId, store);

    try {
      const res = await axios.get(`${baseUrl}/areas`, {
        headers: { 'API-ACCESS-TOKEN': `Bearer ${token}` },
        timeout: 10000,
      });

      const areas: RedxAreaDto[] = (res.data?.areas ?? []).map((row: any) => this.mapArea(row));
      this.allAreasCache.set('all', { value: areas, expiresAt: Date.now() + CACHE_TTL_MS });
      return areas;
    } catch (err) {
      this.logger.error(`RedX area list fetch failed for tenant ${tenantId}: ${err?.message}`);
      throwCourierError('RedX', err);
    }
  }

  /**
   * §3.6 — filtered by postal code. RedX's own endpoint supports a
   * `post_code` query param directly; the cached full list is filtered
   * locally instead of making a second network call per code, since the
   * dataset is already in memory and small.
   */
  async listAreasByPostCode(
    tenantId: string,
    store: StoreEntity | null,
    postCode: number,
  ): Promise<RedxAreaDto[]> {
    const all = await this.listAllAreas(tenantId, store);
    return all.filter((a) => a.postCode === postCode);
  }

  /**
   * §3.7 — filtered by district/division name. RedX's docs note the filter
   * query param is `district_name` but the response field is
   * `division_name` — matched case-insensitively here since the exact
   * casing RedX expects/returns is unconfirmed.
   */
  async listAreasByDistrict(
    tenantId: string,
    store: StoreEntity | null,
    districtName: string,
  ): Promise<RedxAreaDto[]> {
    const all = await this.listAllAreas(tenantId, store);
    const needle = districtName.trim().toLowerCase();
    return all.filter((a) => a.divisionName?.trim().toLowerCase() === needle);
  }
}
