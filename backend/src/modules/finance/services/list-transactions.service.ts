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

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
