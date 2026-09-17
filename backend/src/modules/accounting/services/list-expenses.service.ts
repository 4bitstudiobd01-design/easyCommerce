import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ExpenseEntity } from '../entities/expense.entity';
import { ListExpensesQueryDto } from '../dto/expense.dto';

export interface PaginatedExpenses {
  items: ExpenseEntity[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Paginated, filterable list of expenses for the Transactions → Expenses page.
 * Search matches title, vendor or category. Filtered by category, payment method,
 * status and an inclusive from–to accounting-date range. Newest first.
 */
@Injectable()
export class ListExpensesService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async execute(
    storeId: string,
    query: ListExpensesQueryDto,
  ): Promise<PaginatedExpenses> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.storeId = :storeId', { storeId });

    if (query.category) {
      qb.andWhere('expense.category = :category', { category: query.category });
    }
    if (query.paymentMethod) {
      qb.andWhere('expense.paymentMethod = :paymentMethod', {
        paymentMethod: query.paymentMethod,
      });
    }
    if (query.status) {
      qb.andWhere('expense.status = :status', { status: query.status });
    }
    if (query.from) {
      qb.andWhere('expense.date >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('expense.date <= :to', { to: query.to });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('expense.title ILIKE :s', { s: `%${query.search}%` })
            .orWhere('expense.vendor ILIKE :s', { s: `%${query.search}%` })
            .orWhere('expense.category ILIKE :s', { s: `%${query.search}%` });
        }),
      );
    }

    const [items, total] = await qb
      .orderBy('expense.date', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
