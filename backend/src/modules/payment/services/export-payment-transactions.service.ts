import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../entities/payment.entity';
import { ListPaymentTransactionsService } from './list-payment-transactions.service';
import { ListPaymentTransactionsQueryDto } from '../dto/list-payment-transactions-query.dto';

/** Hard ceiling so a single export can never exhaust server memory. */
const MAX_EXPORT_ROWS = 10000;

const CSV_COLUMNS = [
  'Transaction',
  'Gateway Transaction ID',
  'Order',
  'Customer',
  'Phone',
  'Gateway',
  'Method',
  'Amount',
  'Refunded',
  'Currency',
  'Status',
  'Date',
] as const;

@Injectable()
export class ExportPaymentTransactionsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    private readonly listPaymentTransactionsService: ListPaymentTransactionsService,
  ) {}

  /**
   * Exports exactly the rows the merchant is currently looking at: the same
   * tenant scope, search, status, gateway, method, amount and date filters as
   * the table. Pagination is ignored on purpose — an export covers the whole
   * filtered set, never one page.
   */
  async execute(
    tenantId: string,
    queryDto: ListPaymentTransactionsQueryDto,
  ): Promise<{ filename: string; content: string; rowCount: number; truncated: boolean }> {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('orders', 'ord', 'ord.id = payment."orderId" AND ord."tenantId" = payment."tenantId"')
      .where('payment.tenantId = :tenantId', { tenantId });

    this.listPaymentTransactionsService.applyFilters(qb, queryDto);

    const total = await qb.getCount();
    const truncated = total > MAX_EXPORT_ROWS;

    const rows = await qb
      .select('payment')
      .addSelect('ord."customerName"', 'customerName')
      .addSelect('ord."customerPhone"', 'customerPhone')
      .orderBy('payment."createdAt"', 'DESC')
      .addOrderBy('payment.id', 'ASC')
      .limit(MAX_EXPORT_ROWS)
      .getRawAndEntities();

    const lines: string[] = [CSV_COLUMNS.join(',')];

    rows.entities.forEach((payment, index) => {
      const raw = rows.raw[index] as { customerName?: string; customerPhone?: string };
      const item = this.listPaymentTransactionsService.toListItem(
        payment,
        raw?.customerName,
        raw?.customerPhone,
      );

      lines.push(
        [
          item.transactionNumber,
          item.gatewayTransactionId ?? '',
          item.orderNumber,
          item.customer.name,
          item.customer.phone ?? '',
          item.gatewayLabel,
          item.paymentMethodLabel,
          item.amount.toFixed(2),
          item.refundedAmount.toFixed(2),
          item.currency,
          item.status,
          item.createdAt ? new Date(item.createdAt).toISOString() : '',
        ]
          .map((value) => this.toCsvCell(value))
          .join(','),
      );
    });

    const stamp = new Date().toISOString().slice(0, 10);

    return {
      filename: `payment-transactions-${stamp}.csv`,
      content: lines.join('\n'),
      rowCount: rows.entities.length,
      truncated,
    };
  }

  /**
   * Quotes a CSV cell and neutralises spreadsheet formula injection — a
   * customer-supplied name beginning with =, +, - or @ must never execute
   * when the merchant opens the file in Excel.
   */
  private toCsvCell(value: string): string {
    const raw = String(value ?? '');
    const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${guarded.replace(/"/g, '""')}"`;
  }
}
