import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../entities/expense.entity';
import { ListExpensesQueryDto } from '../dto/expense.dto';

export interface PaginatedExpenses {
  items: ExpenseEntity[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ListExpensesService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async execute(storeId: string, query: ListExpensesQueryDto): Promise<PaginatedExpenses> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.employee', 'employee')
      .where('expense.storeId = :storeId', { storeId });

    if (query.employeeId) {
      qb.andWhere('expense.employeeId = :employeeId', { employeeId: query.employeeId });
    }
    if (query.status) {
      qb.andWhere('expense.status = :status', { status: query.status });
    }
    if (query.category) {
      qb.andWhere('expense.category = :category', { category: query.category });
    }

    const [items, total] = await qb
      .orderBy('expense.expenseDate', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
