import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentDomainService } from './payment-domain.service';
import {
  ListPaymentTransactionsQueryDto,
  PaymentTransactionSortField,
} from '../dto/list-payment-transactions-query.dto';
import {
  PaymentTransactionListItemDto,
  PaymentTransactionListResponseDto,
} from '../dto/payment-transaction-list-response.dto';
import { PAYMENT_GATEWAY_LABELS, PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PAYMENT_METHOD_LABELS, PaymentMethodTypeEnum } from '../enums/payment-method.enum';

interface PaymentTransactionRow {
  payment: PaymentEntity;
  customerName?: string;
  customerPhone?: string;
}

@Injectable()
export class ListPaymentTransactionsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly paymentDomainService: PaymentDomainService,
  ) {}

  async execute(
    tenantId: string,
    queryDto: ListPaymentTransactionsQueryDto,
  ): Promise<PaymentTransactionListResponseDto> {
    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(queryDto.limit) || 10));
    const skip = (page - 1) * limit;

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      // Orders are joined by ID only (no cross-module repository import) so
      // customer identity resolves in one query instead of one per row.
      .leftJoin('orders', 'ord', 'ord.id = payment."orderId" AND ord."tenantId" = payment."tenantId"')
      .where('payment.tenantId = :tenantId', { tenantId });

    this.applyFilters(qb, queryDto);

    const total = await qb.getCount();

    this.applySorting(qb, queryDto);

    const rows = await qb
      .select('payment')
      .addSelect('ord."customerName"', 'customerName')
      .addSelect('ord."customerPhone"', 'customerPhone')
      .offset(skip)
      .limit(limit)
      .getRawAndEntities();

    const data: PaymentTransactionListItemDto[] = rows.entities.map((payment, index) => {
      const raw = rows.raw[index] as PaymentTransactionRow;
      return this.toListItem(payment, raw?.customerName, raw?.customerPhone);
    });

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
   * Shared filter application, reused by the export use case so an export can
   * never return a different record set than the table it was triggered from.
   */
  applyFilters(
    qb: SelectQueryBuilder<PaymentEntity>,
    queryDto: ListPaymentTransactionsQueryDto,
  ): SelectQueryBuilder<PaymentEntity> {
    // Server-side search — always parameterised, never string-concatenated.
    if (queryDto.search && queryDto.search.trim() !== '') {
      const term = `%${queryDto.search.trim()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('payment."transactionNumber" ILIKE :term', { term })
            .orWhere('payment."tranId" ILIKE :term', { term })
            .orWhere('payment."bankTranId" ILIKE :term', { term })
            .orWhere('payment."orderNumber" ILIKE :term', { term })
            .orWhere('ord."customerName" ILIKE :term', { term })
            .orWhere('ord."customerPhone" ILIKE :term', { term });
        }),
      );
    }

    if (queryDto.status) {
      qb.andWhere('payment.status = :status', { status: queryDto.status });
    }

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

    const offsetMinutes = this.paymentDomainService.resolveTimezoneOffsetMinutes(
      queryDto.timezone,
    );
    const period = this.paymentDomainService.resolvePeriod(
      queryDto.dateRange,
      queryDto.dateFrom,
      queryDto.dateTo,
      offsetMinutes,
    );
    // Half-open interval [start, end) — a transaction on the boundary instant
    // belongs to exactly one period, so day boundaries never double-count.
    qb.andWhere('payment."createdAt" >= :periodStart', { periodStart: period.currentStart })
      .andWhere('payment."createdAt" < :periodEnd', { periodEnd: period.currentEnd });

    return qb;
  }

  private applySorting(
    qb: SelectQueryBuilder<PaymentEntity>,
    queryDto: ListPaymentTransactionsQueryDto,
  ): void {
    const sortOrder = queryDto.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    switch (queryDto.sortBy) {
      case PaymentTransactionSortField.AMOUNT:
        qb.orderBy('payment.amount', sortOrder);
        break;
      case PaymentTransactionSortField.STATUS:
        qb.orderBy('payment.status', sortOrder);
        break;
      case PaymentTransactionSortField.ORDER_NUMBER:
        qb.orderBy('payment."orderNumber"', sortOrder);
        break;
      case PaymentTransactionSortField.CREATED_AT:
      default:
        qb.orderBy('payment."createdAt"', sortOrder);
        break;
    }
    // Stable tiebreaker so pagination cannot repeat or skip rows.
    qb.addOrderBy('payment.id', 'ASC');
  }

  toListItem(
    payment: PaymentEntity,
    customerName?: string,
    customerPhone?: string,
  ): PaymentTransactionListItemDto {
    const amount = Number(payment.amount) || 0;
    const refundedAmount = Number(payment.refundedAmount) || 0;
    const gateway = payment.gateway || PaymentGatewayEnum.SSLCOMMERZ;
    const method = payment.paymentMethod || PaymentMethodTypeEnum.CARD;

    return {
      id: payment.id,
      transactionNumber: payment.transactionNumber || `TXN-${payment.id.slice(0, 8).toUpperCase()}`,
      gatewayTransactionId: this.paymentDomainService.maskGatewayReference(
        payment.bankTranId || payment.tranId,
      ),
      orderId: payment.orderId,
      orderNumber: payment.orderNumber,
      customer: {
        id: payment.customerId,
        name: customerName || 'Guest Customer',
        phone: customerPhone || undefined,
      },
      gateway,
      gatewayLabel: PAYMENT_GATEWAY_LABELS[gateway] ?? gateway,
      paymentMethod: method,
      paymentMethodLabel: PAYMENT_METHOD_LABELS[method] ?? method,
      amount,
      refundedAmount,
      currency: payment.currency || 'BDT',
      status: payment.status,
      isRefundable: this.paymentDomainService.isRefundable(
        payment.status,
        amount,
        refundedAmount,
      ),
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
    };
  }
}
