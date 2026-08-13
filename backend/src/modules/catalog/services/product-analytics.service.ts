import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, In } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { OrderEntity, OrderStatusEnum } from '../../order/entities/order.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';

export enum DateRangePreset {
  TODAY = 'TODAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  CUSTOM = 'CUSTOM',
}

export class ProductAnalyticsQueryDto {
  @ApiProperty({ enum: DateRangePreset, default: DateRangePreset.LAST_30_DAYS, required: false })
  @IsOptional()
  @IsEnum(DateRangePreset)
  preset?: DateRangePreset;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-01-31T23:59:59.999Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export interface KpiMetric {
  value: number;
  previousValue: number;
  changePercentage: number;
}

export interface ProductAnalyticsSummaryResult {
  productId: string;
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  revenue: KpiMetric;
  ordersCount: KpiMetric;
  unitsSold: KpiMetric;
  averageOrderValue: KpiMetric;
  hasViewTracking: boolean;
  viewTrackingNotice: string;
}

export interface SalesTrendDataPoint {
  date: string;
  revenue: number;
  orders: number;
  unitsSold: number;
}

export interface VariantAnalyticsBreakdown {
  variantId: string;
  variantTitle: string;
  sku?: string;
  unitsSold: number;
  revenue: number;
  currentStock: number;
}

@Injectable()
export class GetProductAnalyticsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  private resolveDates(dto: ProductAnalyticsQueryDto): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
    const end = dto.endDate ? new Date(dto.endDate) : new Date();
    let start: Date;

    const preset = dto.preset || DateRangePreset.LAST_30_DAYS;

    if (preset === DateRangePreset.TODAY) {
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    } else if (preset === DateRangePreset.LAST_7_DAYS) {
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === DateRangePreset.LAST_90_DAYS) {
      start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (preset === DateRangePreset.CUSTOM && dto.startDate) {
      start = new Date(dto.startDate);
    } else {
      // Default LAST_30_DAYS
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const durationMs = Math.max(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000);
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return { start, end, prevStart, prevEnd };
  }

  private calcPercentage(current: number, previous: number): number {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  async getSummary(
    productId: string,
    tenantId: string,
    dto: ProductAnalyticsQueryDto,
  ): Promise<ProductAnalyticsSummaryResult> {
    const product = await this.productRepository.findOne({ where: { id: productId, tenantId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { start, end, prevStart, prevEnd } = this.resolveDates(dto);

    // Excluded non-qualifying statuses
    const excludedStatuses = [OrderStatusEnum.CANCELLED, OrderStatusEnum.RETURNED];

    // Current period metrics
    const currentItems = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('item.productId = :productId', { productId })
      .andWhere('item.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', { excludedStatuses })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .select([
        'SUM(item.totalPrice) as total_revenue',
        'SUM(item.quantity) as total_units',
        'COUNT(DISTINCT item.orderId) as total_orders',
      ])
      .getRawOne();

    // Previous period metrics
    const prevItems = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('item.productId = :productId', { productId })
      .andWhere('item.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', { excludedStatuses })
      .andWhere('order.createdAt BETWEEN :prevStart AND :prevEnd', { prevStart, prevEnd })
      .select([
        'SUM(item.totalPrice) as total_revenue',
        'SUM(item.quantity) as total_units',
        'COUNT(DISTINCT item.orderId) as total_orders',
      ])
      .getRawOne();

    const currRev = Number(currentItems?.total_revenue || 0);
    const currUnits = Number(currentItems?.total_units || 0);
    const currOrders = Number(currentItems?.total_orders || 0);
    const currAov = currOrders > 0 ? Math.round((currRev / currOrders) * 100) / 100 : 0;

    const prevRev = Number(prevItems?.total_revenue || 0);
    const prevUnits = Number(prevItems?.total_units || 0);
    const prevOrders = Number(prevItems?.total_orders || 0);
    const prevAov = prevOrders > 0 ? Math.round((prevRev / prevOrders) * 100) / 100 : 0;

    return {
      productId,
      preset: dto.preset || DateRangePreset.LAST_30_DAYS,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      revenue: {
        value: currRev,
        previousValue: prevRev,
        changePercentage: this.calcPercentage(currRev, prevRev),
      },
      ordersCount: {
        value: currOrders,
        previousValue: prevOrders,
        changePercentage: this.calcPercentage(currOrders, prevOrders),
      },
      unitsSold: {
        value: currUnits,
        previousValue: prevUnits,
        changePercentage: this.calcPercentage(currUnits, prevUnits),
      },
      averageOrderValue: {
        value: currAov,
        previousValue: prevAov,
        changePercentage: this.calcPercentage(currAov, prevAov),
      },
      hasViewTracking: false,
      viewTrackingNotice: 'Storefront product view tracking is not active yet. Conversion rate metrics will be enabled automatically once storefront telemetry is active.',
    };
  }

  async getSalesTrend(
    productId: string,
    tenantId: string,
    dto: ProductAnalyticsQueryDto,
  ): Promise<SalesTrendDataPoint[]> {
    const { start, end } = this.resolveDates(dto);
    const excludedStatuses = [OrderStatusEnum.CANCELLED, OrderStatusEnum.RETURNED];

    const rawTrend = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('item.productId = :productId', { productId })
      .andWhere('item.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', { excludedStatuses })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .select([
        "TO_CHAR(order.createdAt, 'YYYY-MM-DD') as date_bucket",
        'SUM(item.totalPrice) as daily_revenue',
        'COUNT(DISTINCT item.orderId) as daily_orders',
        'SUM(item.quantity) as daily_units',
      ])
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    return rawTrend.map((row) => ({
      date: row.date_bucket,
      revenue: Number(row.daily_revenue || 0),
      orders: Number(row.daily_orders || 0),
      unitsSold: Number(row.daily_units || 0),
    }));
  }

  async getVariantBreakdown(
    productId: string,
    tenantId: string,
    dto: ProductAnalyticsQueryDto,
  ): Promise<VariantAnalyticsBreakdown[]> {
    const { start, end } = this.resolveDates(dto);
    const excludedStatuses = [OrderStatusEnum.CANCELLED, OrderStatusEnum.RETURNED];

    const variants = await this.variantRepository.find({ where: { productId, tenantId } });
    if (variants.length === 0) {
      return [];
    }

    const rawBreakdown = await this.orderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('item.productId = :productId', { productId })
      .andWhere('item.tenantId = :tenantId', { tenantId })
      .andWhere('item.variantId IS NOT NULL')
      .andWhere('order.orderStatus NOT IN (:...excludedStatuses)', { excludedStatuses })
      .andWhere('order.createdAt BETWEEN :start AND :end', { start, end })
      .select([
        'item.variantId as variant_id',
        'SUM(item.totalPrice) as variant_revenue',
        'SUM(item.quantity) as variant_units',
      ])
      .groupBy('item.variantId')
      .getRawMany();

    const salesMap = new Map<string, { revenue: number; units: number }>();
    rawBreakdown.forEach((r) => {
      salesMap.set(r.variant_id, {
        revenue: Number(r.variant_revenue || 0),
        units: Number(r.variant_units || 0),
      });
    });

    return variants.map((v) => {
      const sales = salesMap.get(v.id) || { revenue: 0, units: 0 };
      return {
        variantId: v.id,
        variantTitle: v.title,
        sku: v.sku,
        unitsSold: sales.units,
        revenue: sales.revenue,
        currentStock: 0, // Stock is tracked separately in Inventory module
      };
    });
  }
}
