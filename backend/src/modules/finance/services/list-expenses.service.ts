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
export class ListExpensesService {
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
      .andWhere('txn.type = :type', { type: FinanceTransactionTypeEnum.EXPENSE });

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

    // Summary calculation for expense categories
    const allCompletedExpenses = await this.transactionRepository.find({
      where: {
        storeId,
        type: FinanceTransactionTypeEnum.EXPENSE,
        status: FinanceTransactionStatusEnum.COMPLETED,
      },
    });

    const categoryBreakdown: Record<string, number> = {
      COGS: 0,
      MARKETING: 0,
      SHIPPING: 0,
      SALARY: 0,
      RENT: 0,
      UTILITIES: 0,
      SOFTWARE: 0,
      EMPLOYEE_EXPENSE: 0,
      OTHER: 0,
    };
    let totalExpense = 0;

    for (const t of allCompletedExpenses) {
      const amt = Number(t.amount || 0);
      totalExpense += amt;
      const cat = t.categoryCode || 'OTHER';
      if (categoryBreakdown[cat] !== undefined) {
        categoryBreakdown[cat] += amt;
      } else {
        categoryBreakdown['OTHER'] += amt;
      }
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalExpense,
        categoryBreakdown,
      },
    };
  }
}
