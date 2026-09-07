import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { ListTransactionsQueryDto } from '../dto/finance-query.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

@Injectable()
export class ListIncomeService {
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
      .leftJoinAndSelect('txn.category', 'category')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.type = :type', { type: FinanceTransactionTypeEnum.INCOME });

    if (query.status) {
      qb.andWhere('txn.status = :status', { status: query.status });
    }

    if (query.accountId) {
      qb.andWhere('txn.accountId = :accountId', { accountId: query.accountId });
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
        '(txn.transactionNumber ILIKE :search OR txn.description ILIKE :search OR txn.reference ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('txn.transactionDate', 'DESC').addOrderBy('txn.createdAt', 'DESC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Optimized DB-level summary calculation for income streams
    const summaryResult = await this.transactionRepository
      .createQueryBuilder('txn')
      .select('COALESCE(SUM(CAST(txn.amount AS NUMERIC)), 0)', 'totalIncome')
      .addSelect(
        "COALESCE(SUM(CASE WHEN txn.categoryCode = 'PRODUCT_SALES' THEN CAST(txn.amount AS NUMERIC) ELSE 0 END), 0)",
        'totalProductSales',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN txn.categoryCode = 'SHIPPING_INCOME' THEN CAST(txn.amount AS NUMERIC) ELSE 0 END), 0)",
        'totalShippingIncome',
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN txn.categoryCode NOT IN ('PRODUCT_SALES', 'SHIPPING_INCOME') THEN CAST(txn.amount AS NUMERIC) ELSE 0 END), 0)",
        'totalOtherIncome',
      )
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.type = :type', { type: FinanceTransactionTypeEnum.INCOME })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .getRawOne();

    const totalIncome = Number(summaryResult?.totalIncome || 0);
    const totalProductSales = Number(summaryResult?.totalProductSales || 0);
    const totalShippingIncome = Number(summaryResult?.totalShippingIncome || 0);
    const totalOtherIncome = Number(summaryResult?.totalOtherIncome || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalProductSales: Math.round(totalProductSales * 100) / 100,
        totalShippingIncome: Math.round(totalShippingIncome * 100) / 100,
        totalOtherIncome: Math.round(totalOtherIncome * 100) / 100,
      },
    };
  }
}
