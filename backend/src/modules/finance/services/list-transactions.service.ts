import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { ListTransactionsQueryDto } from '../dto/finance-query.dto';

@Injectable()
export class ListTransactionsService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async execute(storeId: string, query: ListTransactionsQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.transactionRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.account', 'account')
      .leftJoinAndSelect('txn.toAccount', 'toAccount')
      .leftJoinAndSelect('txn.category', 'category')
      .leftJoinAndSelect('txn.createdByUser', 'createdByUser')
      .leftJoinAndSelect('txn.receiptFile', 'receiptFile')
      .where('txn.storeId = :storeId', { storeId });

    if (query.type) {
      qb.andWhere('txn.type = :type', { type: query.type });
    }

    if (query.status) {
      qb.andWhere('txn.status = :status', { status: query.status });
    }

    if (query.sourceType) {
      qb.andWhere('txn.sourceType = :sourceType', { sourceType: query.sourceType });
    }

    if (query.accountId) {
      qb.andWhere('(txn.accountId = :accountId OR txn.toAccountId = :accountId)', {
        accountId: query.accountId,
      });
    }

    if (query.categoryCode) {
      qb.andWhere('txn.categoryCode = :categoryCode', { categoryCode: query.categoryCode });
    }

    if (query.startDate) {
      qb.andWhere('txn.transactionDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('txn.transactionDate <= :endDate', { endDate: query.endDate });
    }

    if (query.search) {
      qb.andWhere(
        '(txn.transactionNumber ILIKE :search OR txn.description ILIKE :search OR txn.reference ILIKE :search OR txn.categoryCode ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('txn.transactionDate', 'DESC').addOrderBy('txn.createdAt', 'DESC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Determine the recent month from the store's latest transaction date (or fallback to current date)
    const latestTxn = await this.transactionRepository
      .createQueryBuilder('txn')
      .select('txn.transactionDate', 'date')
      .where('txn.storeId = :storeId', { storeId })
      .orderBy('txn.transactionDate', 'DESC')
      .limit(1)
      .getRawOne();

    let targetDateStr: string;
    if (latestTxn?.date instanceof Date) {
      targetDateStr = latestTxn.date.toISOString().split('T')[0];
    } else if (typeof latestTxn?.date === 'string') {
      targetDateStr = latestTxn.date.slice(0, 10);
    } else {
      targetDateStr = new Date().toISOString().split('T')[0];
    }

    const recentYear = parseInt(targetDateStr.substring(0, 4), 10) || new Date().getFullYear();
    const recentMonthNum = parseInt(targetDateStr.substring(5, 7), 10) || (new Date().getMonth() + 1);
    const startOfMonth = `${recentYear}-${String(recentMonthNum).padStart(2, '0')}-01`;
    const lastDay = new Date(recentYear, recentMonthNum, 0).getDate();
    const endOfMonth = `${recentYear}-${String(recentMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const dateObj = new Date(recentYear, recentMonthNum - 1, 1);
    const monthLabel = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // DB-level aggregation for recent month volume, income, and expenses
    const recentMonthStats = await this.transactionRepository
      .createQueryBuilder('txn')
      .select('COALESCE(SUM(CAST(txn.amount AS NUMERIC)), 0)', 'totalVolume')
      .addSelect(
        "COALESCE(SUM(CASE WHEN txn.type = 'INCOME' THEN CAST(txn.amount AS NUMERIC) ELSE 0 END), 0)",
        'totalIncome',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN txn.type = 'EXPENSE' THEN CAST(txn.amount AS NUMERIC) ELSE 0 END), 0)",
        'totalExpense',
      )
      .addSelect('COUNT(*)', 'transactionCount')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.transactionDate >= :startOfMonth AND txn.transactionDate <= :endOfMonth', {
        startOfMonth,
        endOfMonth,
      })
      .getRawOne();

    const totalVolume = Number(recentMonthStats?.totalVolume || 0);
    const totalIncome = Number(recentMonthStats?.totalIncome || 0);
    const totalExpense = Number(recentMonthStats?.totalExpense || 0);
    const netCashFlow = totalIncome - totalExpense;
    const transactionCount = Number(recentMonthStats?.transactionCount || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      recentMonthSummary: {
        month: `${recentYear}-${String(recentMonthNum).padStart(2, '0')}`,
        monthLabel,
        totalVolume: Math.round(totalVolume * 100) / 100,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netCashFlow: Math.round(netCashFlow * 100) / 100,
        transactionCount,
      },
    };
  }
}
