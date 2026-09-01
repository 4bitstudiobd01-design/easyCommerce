import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { ListTransactionsQueryDto } from '../dto/finance-query.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';
import { SeedRealisticFinanceDataService } from './seed-realistic-finance-data.service';

@Injectable()
export class ListExpensesService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    private readonly realisticSeederService: SeedRealisticFinanceDataService,
  ) {}

  async execute(tenantId: string, storeId: string, query: ListTransactionsQueryDto) {
    // Ensure realistic dataset is available
    await this.realisticSeederService.execute(tenantId, storeId);

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.transactionRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.account', 'account')
      .leftJoinAndSelect('txn.category', 'category')
      .leftJoinAndSelect('txn.createdByUser', 'createdByUser')
      .leftJoinAndSelect('txn.receiptFile', 'receiptFile')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.type = :type', { type: FinanceTransactionTypeEnum.EXPENSE });

    if (query.status) {
      qb.andWhere('txn.status = :status', { status: query.status });
    }

    if (query.accountId) {
      qb.andWhere('txn.accountId = :accountId', { accountId: query.accountId });
    }

    if (query.sourceType) {
      qb.andWhere('txn.sourceType = :sourceType', { sourceType: query.sourceType });
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

    // Summary calculation for expense categories (respecting date filters if present)
    const summaryQb = this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.type = :type', { type: FinanceTransactionTypeEnum.EXPENSE })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED });

    if (query.startDate) {
      summaryQb.andWhere('txn.transactionDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      summaryQb.andWhere('txn.transactionDate <= :endDate', { endDate: query.endDate });
    }

    const allFilteredExpenses = await summaryQb.getMany();

    const categoryBreakdown: Record<string, number> = {
      COGS: 0,
      MARKETING: 0,
      SHIPPING: 0,
      SALARY: 0,
      RENT: 0,
      UTILITIES: 0,
      SOFTWARE: 0,
      EQUIPMENT: 0,
      PACKAGING: 0,
      OFFICE_ADMIN: 0,
      MAINTENANCE: 0,
      EMPLOYEE_EXPENSE: 0,
      OTHER: 0,
    };
    let totalExpense = 0;

    for (const t of allFilteredExpenses) {
      const amt = Number(t.amount || 0);
      totalExpense += amt;
      const cat = (t.categoryCode || 'OTHER').toUpperCase();
      if (categoryBreakdown[cat] !== undefined) {
        categoryBreakdown[cat] += amt;
      } else {
        categoryBreakdown[cat] = amt;
      }
    }

    const roundedBreakdown: Record<string, number> = {};
    for (const [k, v] of Object.entries(categoryBreakdown)) {
      roundedBreakdown[k] = Math.round(v * 100) / 100;
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalExpense: Math.round(totalExpense * 100) / 100,
        categoryBreakdown: roundedBreakdown,
      },
    };
  }
}
