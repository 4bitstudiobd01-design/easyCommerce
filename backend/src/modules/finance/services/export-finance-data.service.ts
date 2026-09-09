import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { getMonthDateRange } from '../utils/finance-date.utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface ExportFinanceQueryDto {
  month?: number;
  year?: number;
  type?: string;
  categoryCode?: string;
}

@Injectable()
export class ExportFinanceDataService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async generateTransactionsCsv(storeId: string, query?: ExportFinanceQueryDto): Promise<{ filename: string; csv: string }> {
    const qb = this.transactionRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.account', 'account')
      .leftJoinAndSelect('txn.category', 'category')
      .leftJoinAndSelect('txn.createdByUser', 'createdByUser')
      .leftJoinAndSelect('txn.receiptFile', 'receiptFile')
      .where('txn.storeId = :storeId', { storeId });

    if (query?.type) {
      qb.andWhere('txn.type = :type', { type: query.type });
    }

    if (query?.categoryCode) {
      qb.andWhere('txn.categoryCode = :categoryCode', { categoryCode: query.categoryCode });
    }

    if (query?.year && query?.month && query.month > 0) {
      const { startDate, endDate } = getMonthDateRange(query.year, query.month);
      qb.andWhere('txn.transactionDate >= :start', { start: startDate });
      qb.andWhere('txn.transactionDate <= :end', { end: endDate });
    } else if (query?.year) {
      qb.andWhere('txn.transactionDate >= :start', { start: `${query.year}-01-01` });
      qb.andWhere('txn.transactionDate <= :end', { end: `${query.year}-12-31` });
    }

    qb.orderBy('txn.transactionDate', 'DESC').addOrderBy('txn.createdAt', 'DESC');

    const txns = await qb.getMany();

    const headers = [
      'Date',
      'Month',
      'Year',
      'Transaction ID',
      'Type',
      'Category Code',
      'Category Name',
      'Description',
      'Source Type',
      'Source Ref ID',
      'Amount (BDT)',
      'Payment Method',
      'Account Name',
      'Reference / Voucher',
      'Recorded By Name',
      'Recorded By User ID',
      'Receipt Attached',
      'Status',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = txns.map((t) => {
      const dateParts = (t.transactionDate || '').split('-');
      const y = dateParts[0] || '2026';
      const m = parseInt(dateParts[1] || '1', 10);
      const monthName = MONTH_NAMES[m - 1] || 'Month';

      const creatorName = t.createdByUser?.fullName || t.createdByUser?.email || 'System / Auto';
      const creatorId = t.createdByUser?.id || t.createdByUserId || 'SYS';
      const receiptStatus = t.receiptFile?.url ? `Yes (${t.receiptFile.fileName || 'Attached'})` : (t.receiptFileId ? 'Yes' : 'No');

      return [
        escapeCsv(t.transactionDate),
        escapeCsv(monthName),
        escapeCsv(y),
        escapeCsv(t.transactionNumber),
        escapeCsv(t.type),
        escapeCsv(t.categoryCode || 'OTHER'),
        escapeCsv(t.category?.name || t.categoryCode || 'General'),
        escapeCsv(t.description || ''),
        escapeCsv(t.sourceType || 'MANUAL'),
        escapeCsv(t.sourceId || ''),
        escapeCsv(Number(t.amount || 0).toFixed(2)),
        escapeCsv(t.paymentMethod || 'CASH'),
        escapeCsv(t.account?.name || 'Cash on Hand'),
        escapeCsv(t.reference || ''),
        escapeCsv(creatorName),
        escapeCsv(creatorId),
        escapeCsv(receiptStatus),
        escapeCsv(t.status || 'COMPLETED'),
      ].join(',');
    });

    const csvContent = [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const filename = `finance_transactions_${query?.year || 2026}_${query?.month ? String(query.month).padStart(2, '0') : 'all'}.csv`;

    return {
      filename,
      csv: csvContent,
    };
  }
}
