import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, SelectQueryBuilder } from 'typeorm';
import {
  PaymentEntity,
  PaymentTransactionStatusEnum,
} from '../entities/payment.entity';
import {
  PaymentGatewayEntity,
  PaymentGatewayStatusEnum,
} from '../entities/payment-gateway.entity';
import { PaymentDomainService } from './payment-domain.service';
import { ListPaymentTransactionsQueryDto } from '../dto/list-payment-transactions-query.dto';
import {
  PaymentSummaryResponseDto,
  PaymentKpiMetricDto,
  PaymentTopMethodDto,
} from '../dto/payment-summary-response.dto';
import {
  PAYMENT_METHOD_LABELS,
  PaymentMethodTypeEnum,
} from '../enums/payment-method.enum';
import {
  PAYMENT_GATEWAY_KINDS,
  PAYMENT_GATEWAY_LABELS,
  PaymentGatewayEnum,
} from '../enums/payment-gateway.enum';

interface PeriodAggregateRow {
  settledAmount: string | null;
  settledCount: string | null;
  pendingAmount: string | null;
  pendingCount: string | null;
  refundedAmount: string | null;
  refundedCount: string | null;
}

/**
 * Computes every figure on the Payments dashboard's KPI row, donut chart and
 * "Top Payment Methods" panel.
 *
 * All arithmetic happens inside PostgreSQL — payments are never loaded into
 * Node.js to be summed. The whole summary costs three aggregate queries plus
 * one small gateway lookup, regardless of transaction volume.
 */
@Injectable()
export class GetPaymentSummaryService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(PaymentGatewayEntity)
    private readonly gatewayRepository: Repository<PaymentGatewayEntity>,
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    tenantId: string,
    queryDto: ListPaymentTransactionsQueryDto,
  ): Promise<PaymentSummaryResponseDto> {
    const offsetMinutes = this.paymentDomainService.resolveTimezoneOffsetMinutes(
      queryDto.timezone,
    );
    const period = this.paymentDomainService.resolvePeriod(
      queryDto.dateRange,
      queryDto.dateFrom,
      queryDto.dateTo,
      offsetMinutes,
    );

    const [current, previous, topMethods, gateways, currency] = await Promise.all([
      this.aggregatePeriod(tenantId, queryDto, period.currentStart, period.currentEnd),
      this.aggregatePeriod(tenantId, queryDto, period.previousStart, period.previousEnd),
      this.aggregateTopMethods(tenantId, queryDto, period.currentStart, period.currentEnd),
      this.listGateways(tenantId),
      this.resolveDominantCurrency(tenantId, queryDto, period.currentStart, period.currentEnd),
    ]);

    // "Total Received" is gross captured volume — the money that actually
    // arrived — so refunds are reported separately rather than netted here.
    const totalReceived = this.buildMetric(
      current.settledAmount,
      current.settledCount,
      previous.settledAmount,
    );
    // "Paid" is captured volume net of refunds: what the merchant still holds.
    const paidCurrent = Math.max(0, current.settledAmount - current.refundedAmount);
    const paidPrevious = Math.max(0, previous.settledAmount - previous.refundedAmount);
    const paid = this.buildMetric(paidCurrent, current.settledCount, paidPrevious);

    const pending = this.buildMetric(
      current.pendingAmount,
      current.pendingCount,
      previous.pendingAmount,
    );
    const refunded = this.buildMetric(
      current.refundedAmount,
      current.refundedCount,
      previous.refundedAmount,
    );

    // Donut slices partition Total Received plus outstanding pending volume.
    const donutTotal = paidCurrent + current.pendingAmount + current.refundedAmount;
    const overview = [
      {
        label: 'Paid',
        amount: paidCurrent,
        percentage: this.paymentDomainService.calculatePercentage(paidCurrent, donutTotal),
      },
      {
        label: 'Pending',
        amount: current.pendingAmount,
        percentage: this.paymentDomainService.calculatePercentage(
          current.pendingAmount,
          donutTotal,
        ),
      },
      {
        label: 'Refunded',
        amount: current.refundedAmount,
        percentage: this.paymentDomainService.calculatePercentage(
          current.refundedAmount,
          donutTotal,
        ),
      },
    ];

    return {
      totalReceived,
      paid,
      pending,
      refunded,
      overview,
      topPaymentMethods: topMethods,
      gateways,
      currency,
      periodStart: period.currentStart,
      periodEnd: period.currentEnd,
    };
  }

  /**
   * One pass over the period producing settled / pending / refunded totals.
   *
   * Refunded volume comes from `payments.refundedAmount`, which the refund
   * domain maintains — so a partially refunded payment contributes its captured
   * amount to settled volume and only the returned part to refunded volume.
   * Refunds are therefore never double-counted.
   */
  private async aggregatePeriod(
    tenantId: string,
    queryDto: ListPaymentTransactionsQueryDto,
    start: Date,
    end: Date,
  ): Promise<{
    settledAmount: number;
    settledCount: number;
    pendingAmount: number;
    pendingCount: number;
    refundedAmount: number;
    refundedCount: number;
  }> {
    const qb = this.baseScopedQuery(tenantId, queryDto, start, end);

    const raw: PeriodAggregateRow | undefined = await qb
      .select([
        `COALESCE(SUM(CASE WHEN payment.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED') THEN payment.amount ELSE 0 END), 0) AS "settledAmount"`,
        `COUNT(CASE WHEN payment.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED') THEN 1 END) AS "settledCount"`,
        `COALESCE(SUM(CASE WHEN payment.status IN ('PENDING','PROCESSING') THEN payment.amount ELSE 0 END), 0) AS "pendingAmount"`,
        `COUNT(CASE WHEN payment.status IN ('PENDING','PROCESSING') THEN 1 END) AS "pendingCount"`,
        `COALESCE(SUM(payment."refundedAmount"), 0) AS "refundedAmount"`,
        `COUNT(CASE WHEN payment."refundedAmount" > 0 THEN 1 END) AS "refundedCount"`,
      ])
      .getRawOne();

    return {
      settledAmount: Number(raw?.settledAmount ?? 0),
      settledCount: Number(raw?.settledCount ?? 0),
      pendingAmount: Number(raw?.pendingAmount ?? 0),
      pendingCount: Number(raw?.pendingCount ?? 0),
      refundedAmount: Number(raw?.refundedAmount ?? 0),
      refundedCount: Number(raw?.refundedCount ?? 0),
    };
  }

  /** GROUP BY payment method over settled volume, ranked by amount. */
  private async aggregateTopMethods(
    tenantId: string,
    queryDto: ListPaymentTransactionsQueryDto,
    start: Date,
    end: Date,
  ): Promise<PaymentTopMethodDto[]> {
    const rows = await this.baseScopedQuery(tenantId, queryDto, start, end)
      .andWhere(
        `payment.status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED')`,
      )
      .select('payment."paymentMethod"', 'method')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .addSelect('COUNT(payment.id)', 'count')
      .groupBy('payment."paymentMethod"')
      .orderBy('SUM(payment.amount)', 'DESC')
      .getRawMany<{ method: PaymentMethodTypeEnum; amount: string; count: string }>();

    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return rows.map((row) => ({
      method: row.method,
      label: PAYMENT_METHOD_LABELS[row.method] ?? row.method,
      amount: Number(row.amount || 0),
      count: Number(row.count || 0),
      percentage: this.paymentDomainService.calculatePercentage(Number(row.amount || 0), total),
    }));
  }

  /**
   * Gateways the merchant has connected. Falls back to deriving the set from
   * observed transactions when the tenant has no explicit gateway records yet,
   * so the panel reflects reality instead of showing hardcoded providers.
   */
  private async listGateways(tenantId: string) {
    const configured = await this.gatewayRepository.find({
      where: { tenantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    if (configured.length > 0) {
      return configured.map((gateway) => ({
        id: gateway.id,
        code: gateway.code,
        name: gateway.name,
        kind: gateway.kind,
        status: gateway.status,
        isEnabled: gateway.isEnabled,
      }));
    }

    const observed = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .select('payment.gateway', 'code')
      .groupBy('payment.gateway')
      .getRawMany<{ code: PaymentGatewayEnum }>();

    return observed.map((row) => ({
      id: row.code,
      code: row.code,
      name: PAYMENT_GATEWAY_LABELS[row.code] ?? row.code,
      kind: PAYMENT_GATEWAY_KINDS[row.code] ?? 'Payment Gateway',
      status: PaymentGatewayStatusEnum.CONNECTED,
      isEnabled: true,
    }));
  }

  /** The currency carrying the most volume, used to format dashboard totals. */
  private async resolveDominantCurrency(
    tenantId: string,
    queryDto: ListPaymentTransactionsQueryDto,
    start: Date,
    end: Date,
  ): Promise<string> {
    const row = await this.baseScopedQuery(tenantId, queryDto, start, end)
      .select('payment.currency', 'currency')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .groupBy('payment.currency')
      .orderBy('SUM(payment.amount)', 'DESC')
      .limit(1)
      .getRawOne<{ currency: string }>();

    return row?.currency || queryDto.currency?.toUpperCase() || 'BDT';
  }

  /**
   * Tenant-scoped base query carrying the same non-date filters as the table,
   * so KPIs, donut and table always describe the same record set.
   */
  private baseScopedQuery(
    tenantId: string,
    queryDto: ListPaymentTransactionsQueryDto,
    start: Date,
    end: Date,
  ): SelectQueryBuilder<PaymentEntity> {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment."createdAt" >= :start', { start })
      .andWhere('payment."createdAt" < :end', { end });

    if (queryDto.gateway) {
      qb.andWhere('payment.gateway = :gateway', { gateway: queryDto.gateway });
    }
    if (queryDto.paymentMethod) {
      qb.andWhere('payment."paymentMethod" = :paymentMethod', {
        paymentMethod: queryDto.paymentMethod,
      });
    }
    if (queryDto.currency && queryDto.currency.trim() !== '') {
      qb.andWhere('payment.currency = :currency', {
        currency: queryDto.currency.trim().toUpperCase(),
      });
    }
    if (queryDto.minAmount !== undefined && queryDto.minAmount !== null) {
      qb.andWhere('payment.amount >= :minAmount', { minAmount: queryDto.minAmount });
    }
    if (queryDto.maxAmount !== undefined && queryDto.maxAmount !== null) {
      qb.andWhere('payment.amount <= :maxAmount', { maxAmount: queryDto.maxAmount });
    }
    if (queryDto.search && queryDto.search.trim() !== '') {
      const term = `%${queryDto.search.trim()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('payment."transactionNumber" ILIKE :term', { term })
            .orWhere('payment."tranId" ILIKE :term', { term })
            .orWhere('payment."bankTranId" ILIKE :term', { term })
            .orWhere('payment."orderNumber" ILIKE :term', { term });
        }),
      );
    }

    // NOTE: the status filter is deliberately NOT applied. KPI cards must keep
    // showing the paid/pending/refunded split even while the table is narrowed
    // to a single status.
    return qb;
  }

  private buildMetric(
    currentAmount: number,
    currentCount: number,
    previousAmount: number,
  ): PaymentKpiMetricDto {
    return {
      amount: Math.round(currentAmount * 100) / 100,
      count: currentCount,
      previousAmount: Math.round(previousAmount * 100) / 100,
      changePercent: this.paymentDomainService.calculateChangePercent(
        currentAmount,
        previousAmount,
      ),
    };
  }
}
