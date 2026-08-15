import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConsignmentEntity,
  ConsignmentStatusEnum,
  CourierProviderEnum,
} from '../entities/consignment.entity';
import { CourierIntegrationEntity } from '../entities/courier-integration.entity';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import {
  CouriersDashboardResponseDto,
  CourierConnectionStatus,
  CourierIntegrationDto,
} from '../dto/courier-integration-response.dto';
import {
  CourierIntegrationMapperService,
  CourierShipmentStats,
} from './courier-integration-mapper.service';

/** Statuses whose outcome is already decided, for the success-rate denominator. */
const CONCLUDED_STATUSES: readonly ConsignmentStatusEnum[] = [
  ConsignmentStatusEnum.DELIVERED,
  ConsignmentStatusEnum.RETURNED,
  ConsignmentStatusEnum.DELIVERY_FAILED,
];

const ACTIVE_WINDOW_DAYS = 30;

/**
 * Powers the Couriers tab: every supported provider, the merchant's connection
 * state for it, and the shipment counts actually booked with it.
 *
 * Providers with no integration row are included — the merchant needs to see
 * what they *could* connect, not just what they already have.
 */
@Injectable()
export class ListCourierIntegrationsService {
  constructor(
    @InjectRepository(CourierIntegrationEntity)
    private readonly integrationRepository: Repository<CourierIntegrationEntity>,
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    private readonly registry: CourierProviderRegistry,
    private readonly mapper: CourierIntegrationMapperService,
  ) {}

  async execute(tenantId: string): Promise<CouriersDashboardResponseDto> {
    const [integrations, stats, activeProviders] = await Promise.all([
      this.integrationRepository.find({ where: { tenantId } }),
      this.aggregateShipmentStats(tenantId),
      this.findRecentlyUsedProviders(tenantId),
    ]);

    const byProvider = this.mapper.indexByProvider(integrations);

    const couriers = this.registry
      .listAdapters()
      .map((adapter) =>
        this.mapper.toDto(adapter, byProvider.get(adapter.provider), stats.get(adapter.provider)),
      )
      // Connected first, then by volume — the providers a merchant actually
      // uses belong at the top of the table.
      .sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
        return b.shipments - a.shipments;
      });

    return {
      summary: this.buildSummary(couriers, activeProviders),
      couriers,
    };
  }

  /**
   * One grouped query rather than a query per provider, and always filtered by
   * tenant so a merchant's courier stats can only ever describe their own
   * parcels.
   */
  private async aggregateShipmentStats(
    tenantId: string,
  ): Promise<Map<CourierProviderEnum, CourierShipmentStats>> {
    // The provider column is referenced in its quoted SQL form, matching
    // GetShipmentSummaryService — TypeORM does not reliably map the property
    // form to a raw alias inside an aggregate + GROUP BY, and getting it wrong
    // silently attributes one courier's parcels to another.
    const concludedList = CONCLUDED_STATUSES.map((status) => `'${status}'`).join(',');

    const rows = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('consignment."courierProvider"', 'provider')
      .addSelect('COUNT(consignment.id)', 'shipments')
      .addSelect(
        `COUNT(CASE WHEN consignment.status = '${ConsignmentStatusEnum.DELIVERED}' THEN 1 END)`,
        'delivered',
      )
      .addSelect(
        `COUNT(CASE WHEN consignment.status IN (${concludedList}) THEN 1 END)`,
        'concluded',
      )
      .where('consignment."tenantId" = :tenantId', { tenantId })
      .groupBy('consignment."courierProvider"')
      .getRawMany<{
        provider: CourierProviderEnum;
        shipments: string;
        delivered: string;
        concluded: string;
      }>();

    return new Map(
      rows.map((row) => [
        row.provider,
        {
          shipments: Number(row.shipments) || 0,
          delivered: Number(row.delivered) || 0,
          concluded: Number(row.concluded) || 0,
        },
      ]),
    );
  }

  /** Providers that booked at least one parcel inside the active window. */
  private async findRecentlyUsedProviders(
    tenantId: string,
  ): Promise<Set<CourierProviderEnum>> {
    const since = new Date();
    since.setDate(since.getDate() - ACTIVE_WINDOW_DAYS);

    const rows = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('DISTINCT consignment."courierProvider"', 'provider')
      .where('consignment."tenantId" = :tenantId', { tenantId })
      .andWhere('consignment."createdAt" >= :since', { since })
      .getRawMany<{ provider: CourierProviderEnum }>();

    return new Set(rows.map((row) => row.provider));
  }

  /**
   * The KPI row.
   *
   * `change` is null throughout: these are point-in-time counts of a handful of
   * integration rows, and there is no historical snapshot to compare against.
   * Reporting null lets the UI omit the trend chip rather than print an
   * invented percentage.
   */
  private buildSummary(
    couriers: CourierIntegrationDto[],
    activeProviders: Set<CourierProviderEnum>,
  ): CouriersDashboardResponseDto['summary'] {
    const connected = couriers.filter(
      (courier) => courier.status === CourierConnectionStatus.CONNECTED,
    );
    const active = connected.filter((courier) => activeProviders.has(courier.code));

    // Only providers that have actually been called carry a meaningful rate.
    const rated = connected.filter((courier) => courier.apiHealth !== 'N/A');
    const averageRate =
      rated.length > 0
        ? Math.round(
            (rated.reduce((sum, courier) => sum + courier.apiSuccessRate, 0) / rated.length) * 10,
          ) / 10
        : 0;

    return {
      totalCouriers: { count: couriers.length, change: null },
      connected: { count: connected.length, change: null },
      disconnected: { count: couriers.length - connected.length, change: null },
      active: { count: active.length, change: null },
      apiHealth: { rate: averageRate, change: null },
    };
  }
}
