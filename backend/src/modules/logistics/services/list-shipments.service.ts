import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { ConsignmentEntity } from '../entities/consignment.entity';
import { ShipmentDomainService, CONSIGNMENT_STATUS_LABELS, COD_STATUS_LABELS } from './shipment-domain.service';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { ListShipmentsQueryDto, ShipmentSortField } from '../dto/list-shipments-query.dto';
import {
  ShipmentListItemDto,
  ShipmentListResponseDto,
} from '../dto/shipment-list-response.dto';

interface ShipmentJoinedRow {
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
}

/** Sort fields mapped to real columns, so sortBy can never inject SQL. */
const SORT_COLUMNS: Record<ShipmentSortField, string> = {
  [ShipmentSortField.CREATED_AT]: 'consignment."createdAt"',
  [ShipmentSortField.COD_AMOUNT]: 'consignment."codAmount"',
  [ShipmentSortField.STATUS]: 'consignment.status',
  [ShipmentSortField.SHIPMENT_NUMBER]: 'consignment."shipmentNumber"',
};

@Injectable()
export class ListShipmentsService {
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
  ): Promise<ShipmentListResponseDto> {
    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryDto.limit) || 10));
    const skip = (page - 1) * limit;

    const qb = this.baseQuery(tenantId);
    this.applyFilters(qb, queryDto);

    const total = await qb.getCount();

    this.applySorting(qb, queryDto);

    const rows = await qb
      .select('consignment')
      .addSelect('ord."customerName"', 'customerName')
      .addSelect('ord."customerPhone"', 'customerPhone')
      .addSelect('ord."customerId"', 'customerId')
      .offset(skip)
      .limit(limit)
      .getRawAndEntities();

    const data = rows.entities.map((consignment, index) =>
      this.toListItem(consignment, rows.raw[index] as ShipmentJoinedRow, currency),
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  /**
   * Tenant-scoped base query.
   *
   * The order is joined by ID in the same statement — never through a
   * cross-module repository import, and never one query per row — so customer
   * identity resolves without an N+1.
   */
  baseQuery(tenantId: string): SelectQueryBuilder<ConsignmentEntity> {
    return this.consignmentRepository
      .createQueryBuilder('consignment')
      .leftJoin(
        'orders',
        'ord',
        'ord.id = consignment."orderId" AND ord."tenantId" = consignment."tenantId"',
      )
      .where('consignment.tenantId = :tenantId', { tenantId });
  }

  /**
   * Shared filter application, reused by the export use case so an export can
   * never return a different record set than the table it was triggered from.
   */
  applyFilters(
    qb: SelectQueryBuilder<ConsignmentEntity>,
    queryDto: ListShipmentsQueryDto,
  ): void {
    const offsetMinutes = this.shipmentDomainService.resolveTimezoneOffsetMinutes(
      queryDto.timezone,
    );
    const period = this.shipmentDomainService.resolvePeriod(
      queryDto.dateRange,
      queryDto.dateFrom,
      queryDto.dateTo,
      offsetMinutes,
    );

    qb.andWhere('consignment."createdAt" >= :periodStart', { periodStart: period.currentStart })
      .andWhere('consignment."createdAt" < :periodEnd', { periodEnd: period.currentEnd });

    if (queryDto.courierProvider) {
      qb.andWhere('consignment."courierProvider" = :courierProvider', {
        courierProvider: queryDto.courierProvider,
      });
    }
    if (queryDto.status) {
      qb.andWhere('consignment.status = :status', { status: queryDto.status });
    }
    if (queryDto.codStatus) {
      qb.andWhere('consignment."codStatus" = :codStatus', { codStatus: queryDto.codStatus });
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
      // Parameterised throughout — the term is never concatenated into SQL.
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
  }

  private applySorting(
    qb: SelectQueryBuilder<ConsignmentEntity>,
    queryDto: ListShipmentsQueryDto,
  ): void {
    const column =
      SORT_COLUMNS[queryDto.sortBy as ShipmentSortField] ??
      SORT_COLUMNS[ShipmentSortField.CREATED_AT];
    const direction = queryDto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(column, direction)
      // Stable tiebreak so pagination can never repeat or skip a row.
      .addOrderBy('consignment.id', 'ASC');
  }

  /** Maps a row to the merchant-facing shape. No courier credentials are ever included. */
  toListItem(
    consignment: ConsignmentEntity,
    raw: ShipmentJoinedRow | undefined,
    currency = 'BDT',
  ): ShipmentListItemDto {
    return {
      id: consignment.id,
      shipmentNumber: consignment.shipmentNumber,
      orderId: consignment.orderId,
      orderNumber: consignment.orderNumber,
      customer: {
        id: raw?.customerId ?? consignment.customerId ?? undefined,
        // Falls back to the recipient captured on the parcel when the order has
        // no customer record, so the cell is never blank.
        name: raw?.customerName || consignment.recipientName || 'Unknown customer',
        phone: raw?.customerPhone || consignment.recipientPhone || undefined,
      },
      courierProvider: consignment.courierProvider,
      courierName: this.courierProviderRegistry.getDisplayName(consignment.courierProvider),
      trackingCode: consignment.trackingCode ?? null,
      codAmount: Number(consignment.codAmount) || 0,
      codStatus: consignment.codStatus,
      codStatusLabel: COD_STATUS_LABELS[consignment.codStatus] ?? consignment.codStatus,
      currency,
      status: consignment.status,
      statusLabel: CONSIGNMENT_STATUS_LABELS[consignment.status] ?? consignment.status,
      city: consignment.city,
      parcelWeight: Number(consignment.parcelWeight) || 0,
      isCancellable: this.shipmentDomainService.isCancellable(consignment.status),
      createdAt: consignment.createdAt,
      updatedAt: consignment.updatedAt,
    };
  }
}
