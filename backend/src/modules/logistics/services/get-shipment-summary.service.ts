import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import {
  CodStatusEnum,
  ConsignmentEntity,
  ConsignmentStatusEnum,
  CourierProviderEnum,
  IN_TRANSIT_CONSIGNMENT_STATUSES,
  PENDING_CONSIGNMENT_STATUSES,
} from '../entities/consignment.entity';
import { ShipmentDomainService } from './shipment-domain.service';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { ListShipmentsQueryDto } from '../dto/list-shipments-query.dto';
import {
  CodSummaryDto,
  CourierPerformanceDto,
  ShipmentKpiMetricDto,
  ShipmentSummaryResponseDto,
} from '../dto/shipment-summary-response.dto';

interface PeriodAggregateRow {
  totalShipments: string | null;
  pending: string | null;
  inTransit: string | null;
  delivered: string | null;
  returned: string | null;
  failed: string | null;
  codCollected: string | null;
  codPending: string | null;
}

const PENDING_LIST = PENDING_CONSIGNMENT_STATUSES.map((s) => `'${s}'`).join(',');
const IN_TRANSIT_LIST = IN_TRANSIT_CONSIGNMENT_STATUSES.map((s) => `'${s}'`).join(',');

/**
 * Computes every figure on the Shipments dashboard: the seven KPI cards, the
 * overview donut, courier performance and the COD summary.
 *
 * All arithmetic happens inside PostgreSQL — shipments are never loaded into
 * Node.js to be counted or summed. The whole summary costs four aggregate
 * queries regardless of how many shipments the merchant has.
 */
@Injectable()
export class GetShipmentSummaryService {
  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    private readonly shipmentDomainService: ShipmentDomainService,
    private readonly courierProviderRegistry: CourierProviderRegistry,
  ) {}

  async execute(
    tenantId: string,
    queryDto: ListShipmentsQueryDto,
    currency = 'BDT',
  ): Promise<ShipmentSummaryResponseDto> {
    const offsetMinutes = this.shipmentDomainService.resolveTimezoneOffsetMinutes(
      queryDto.timezone,
    );
    const period = this.shipmentDomainService.resolvePeriod(
      queryDto.dateRange,
      queryDto.dateFrom,
      queryDto.dateTo,
      offsetMinutes,
    );

    const [current, previous, courierPerformance, codSummary] = await Promise.all([
      this.aggregatePeriod(tenantId, queryDto, period.currentStart, period.currentEnd),
      this.aggregatePeriod(tenantId, queryDto, period.previousStart, period.previousEnd),
      this.aggregateCourierPerformance(
        tenantId,
        queryDto,
        period.currentStart,
        period.currentEnd,
      ),
      // The COD panel is explicitly "This Month", so it deliberately ignores the
      // table's date filter and always describes the current calendar month.
      this.aggregateCodSummary(tenantId, offsetMinutes),
    ]);

    // The donut partitions the same shipment set the KPI row counts.
    const overviewTotal = current.totalShipments;
    const overview = [
      { label: 'Delivered', count: current.delivered },
      { label: 'In Transit', count: current.inTransit },
      { label: 'Pending', count: current.pending },
      { label: 'Returned', count: current.returned },
      { label: 'Failed', count: current.failed },
    ].map((slice) => ({
      ...slice,
      percentage: this.shipmentDomainService.calculatePercentage(slice.count, overviewTotal),
    }));

    return {
      totalShipments: this.buildCountMetric(current.totalShipments, previous.totalShipments),
      pending: this.buildCountMetric(current.pending, previous.pending),
      inTransit: this.buildCountMetric(current.inTransit, previous.inTransit),
      delivered: this.buildCountMetric(current.delivered, previous.delivered),
      returned: this.buildCountMetric(current.returned, previous.returned),
      codCollected: this.buildAmountMetric(current.codCollected, previous.codCollected),
      codPending: this.buildAmountMetric(current.codPending, previous.codPending),
      overview,
      overviewTotal,
      courierPerformance,
      codSummary,
      currency,
      periodStart: period.currentStart,
      periodEnd: period.currentEnd,
    };
  }

  /** One pass over the period producing every count and COD total. */
  private async aggregatePeriod(
    tenantId: string,
    queryDto: ListShipmentsQueryDto,
    start: Date,
    end: Date,
  ) {
    const raw: PeriodAggregateRow | undefined = await this.baseScopedQuery(
      tenantId,
      queryDto,
      start,
      end,
    )
      .select([
        `COUNT(consignment.id) AS "totalShipments"`,
        `COUNT(CASE WHEN consignment.status IN (${PENDING_LIST}) THEN 1 END) AS "pending"`,
        `COUNT(CASE WHEN consignment.status IN (${IN_TRANSIT_LIST}) THEN 1 END) AS "inTransit"`,
        `COUNT(CASE WHEN consignment.status = '${ConsignmentStatusEnum.DELIVERED}' THEN 1 END) AS "delivered"`,
        `COUNT(CASE WHEN consignment.status IN ('${ConsignmentStatusEnum.RETURNED}','${ConsignmentStatusEnum.RETURNING}') THEN 1 END) AS "returned"`,
        `COUNT(CASE WHEN consignment.status = '${ConsignmentStatusEnum.DELIVERY_FAILED}' THEN 1 END) AS "failed"`,
        // Collected and settled cash has reached the merchant's books.
        `COALESCE(SUM(CASE WHEN consignment."codStatus" IN ('${CodStatusEnum.COLLECTED}','${CodStatusEnum.SETTLED}') THEN consignment."codAmount" ELSE 0 END), 0) AS "codCollected"`,
        `COALESCE(SUM(CASE WHEN consignment."codStatus" = '${CodStatusEnum.PENDING}' THEN consignment."codAmount" ELSE 0 END), 0) AS "codPending"`,
      ])
      .getRawOne();

    return {
      totalShipments: Number(raw?.totalShipments ?? 0),
      pending: Number(raw?.pending ?? 0),
      inTransit: Number(raw?.inTransit ?? 0),
      delivered: Number(raw?.delivered ?? 0),
      returned: Number(raw?.returned ?? 0),
      failed: Number(raw?.failed ?? 0),
      codCollected: Number(raw?.codCollected ?? 0),
      codPending: Number(raw?.codPending ?? 0),
    };
  }

  /**
   * GROUP BY courier over the filtered period.
   *
   * Success rate is delivered as a share of *concluded* shipments — parcels
   * still in transit are excluded, otherwise a courier's rate would be dragged
   * down purely by recent volume that has not had time to arrive yet.
   */
  private async aggregateCourierPerformance(
    tenantId: string,
    queryDto: ListShipmentsQueryDto,
    start: Date,
    end: Date,
  ): Promise<CourierPerformanceDto[]> {
    const rows = await this.baseScopedQuery(tenantId, queryDto, start, end)
      .select('consignment."courierProvider"', 'provider')
      .addSelect('COUNT(consignment.id)', 'deliveries')
      .addSelect(
        `COUNT(CASE WHEN consignment.status = '${ConsignmentStatusEnum.DELIVERED}' THEN 1 END)`,
        'delivered',
      )
      .addSelect(
        `COUNT(CASE WHEN consignment.status IN ('${ConsignmentStatusEnum.DELIVERED}','${ConsignmentStatusEnum.RETURNED}','${ConsignmentStatusEnum.DELIVERY_FAILED}') THEN 1 END)`,
        'concluded',
      )
      .groupBy('consignment."courierProvider"')
      .orderBy('COUNT(consignment.id)', 'DESC')
      .getRawMany<{
        provider: CourierProviderEnum;
        deliveries: string;
        delivered: string;
        concluded: string;
      }>();

    return rows.map((row) => ({
      provider: row.provider,
      name: this.courierProviderRegistry.getDisplayName(row.provider),
      deliveries: Number(row.deliveries || 0),
      successRate: this.shipmentDomainService.calculatePercentage(
        Number(row.delivered || 0),
        Number(row.concluded || 0),
      ),
    }));
  }

  /** COD position for the merchant's current calendar month. */
  private async aggregateCodSummary(
    tenantId: string,
    offsetMinutes: number,
  ): Promise<CodSummaryDto> {
    const monthStart = this.shipmentDomainService.resolveMonthStart(offsetMinutes);

    const raw = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .where('consignment.tenantId = :tenantId', { tenantId })
      .andWhere('consignment."createdAt" >= :monthStart', { monthStart })
      // Prepaid parcels carry no cash, so they never enter the COD ledger.
      .andWhere('consignment."codStatus" != :notApplicable', {
        notApplicable: CodStatusEnum.NOT_APPLICABLE,
      })
      .select([
        `COALESCE(SUM(consignment."codAmount"), 0) AS "total"`,
        `COALESCE(SUM(CASE WHEN consignment."codStatus" IN ('${CodStatusEnum.COLLECTED}','${CodStatusEnum.SETTLED}') THEN consignment."codAmount" ELSE 0 END), 0) AS "collected"`,
        `COALESCE(SUM(CASE WHEN consignment."codStatus" = '${CodStatusEnum.COLLECTED}' THEN consignment."codAmount" ELSE 0 END), 0) AS "pendingSettlement"`,
        `COALESCE(SUM(CASE WHEN consignment."codStatus" = '${CodStatusEnum.RETURNED}' THEN consignment."codAmount" ELSE 0 END), 0) AS "returned"`,
      ])
      .getRawOne<{
        total: string;
        collected: string;
        pendingSettlement: string;
        returned: string;
      }>();

    return {
      total: Number(raw?.total ?? 0),
      collected: Number(raw?.collected ?? 0),
      pendingSettlement: Number(raw?.pendingSettlement ?? 0),
      returned: Number(raw?.returned ?? 0),
    };
  }

  /**
   * Tenant-scoped base query carrying the same non-status filters as the table,
   * so the KPIs describe the same record set the merchant is looking at.
   */
  private baseScopedQuery(
    tenantId: string,
    queryDto: ListShipmentsQueryDto,
    start: Date,
    end: Date,
  ): SelectQueryBuilder<ConsignmentEntity> {
    const qb = this.consignmentRepository
      .createQueryBuilder('consignment')
      .leftJoin(
        'orders',
        'ord',
        'ord.id = consignment."orderId" AND ord."tenantId" = consignment."tenantId"',
      )
      .where('consignment.tenantId = :tenantId', { tenantId })
      .andWhere('consignment."createdAt" >= :start', { start })
      .andWhere('consignment."createdAt" < :end', { end });

    if (queryDto.courierProvider) {
      qb.andWhere('consignment."courierProvider" = :courierProvider', {
        courierProvider: queryDto.courierProvider,
      });
    }
    if (queryDto.city && queryDto.city.trim() !== '') {
      qb.andWhere('consignment.city ILIKE :city', { city: `%${queryDto.city.trim()}%` });
    }
    if (queryDto.minAmount !== undefined && queryDto.minAmount !== null) {
      qb.andWhere('consignment."codAmount" >= :minAmount', { minAmount: queryDto.minAmount });
    }
    if (queryDto.maxAmount !== undefined && queryDto.maxAmount !== null) {
      qb.andWhere('consignment."codAmount" <= :maxAmount', { maxAmount: queryDto.maxAmount });
    }
    if (queryDto.minWeight !== undefined && queryDto.minWeight !== null) {
      qb.andWhere('consignment."parcelWeight" >= :minWeight', { minWeight: queryDto.minWeight });
    }
    if (queryDto.maxWeight !== undefined && queryDto.maxWeight !== null) {
      qb.andWhere('consignment."parcelWeight" <= :maxWeight', { maxWeight: queryDto.maxWeight });
    }
    if (queryDto.search && queryDto.search.trim() !== '') {
      const term = `%${queryDto.search.trim()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('consignment."shipmentNumber" ILIKE :term', { term })
            .orWhere('consignment."orderNumber" ILIKE :term', { term })
            .orWhere('consignment."trackingCode" ILIKE :term', { term })
            .orWhere('consignment."recipientName" ILIKE :term', { term })
            .orWhere('consignment."recipientPhone" ILIKE :term', { term })
            .orWhere('ord."customerName" ILIKE :term', { term })
            .orWhere('ord."customerPhone" ILIKE :term', { term });
        }),
      );
    }

    // NOTE: status and codStatus filters are deliberately NOT applied. The KPI
    // row must keep showing the full pending/in-transit/delivered split even
    // while the table is narrowed to a single status.
    return qb;
  }

  private buildCountMetric(current: number, previous: number): ShipmentKpiMetricDto {
    return {
      count: current,
      amount: 0,
      previous,
      changePercent: this.shipmentDomainService.calculateChangePercent(current, previous),
    };
  }

  private buildAmountMetric(current: number, previous: number): ShipmentKpiMetricDto {
    return {
      count: 0,
      amount: Math.round(current * 100) / 100,
      previous: Math.round(previous * 100) / 100,
      changePercent: this.shipmentDomainService.calculateChangePercent(current, previous),
    };
  }
}
