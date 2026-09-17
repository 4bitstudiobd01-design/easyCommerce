import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExpenseEntity,
  ExpenseStatusEnum,
} from '../entities/expense.entity';

export interface ExpenseStats {
  /** Sum of every expense dated in the current calendar month, as a fixed(2) string. */
  totalExpenses: string;
  /** Portion of totalExpenses with status PAID. */
  totalPaid: string;
  /** Portion of totalExpenses with status DUE. */
  totalDue: string;
  /** totalExpenses divided by the day-of-month of today, fixed(2). */
  avgPerDay: string;
}

function monthBounds(now: Date): { from: string; to: string } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

/**
 * KPI figures for the Expenses page, scoped to the current calendar month by the
 * expense's accounting `date`.
 */
@Injectable()
export class GetExpenseStatsService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async execute(storeId: string): Promise<ExpenseStats> {
    const now = new Date();
    const { from, to } = monthBounds(now);

    const rows = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.status', 'status')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.storeId = :storeId', { storeId })
      .andWhere('expense.date >= :from', { from })
      .andWhere('expense.date <= :to', { to })
      .groupBy('expense.status')
      .getRawMany<{ status: ExpenseStatusEnum; total: string }>();

    let totalPaid = 0;
    let totalDue = 0;
    for (const row of rows) {
      const total = Number(row.total);
      if (row.status === ExpenseStatusEnum.PAID) totalPaid = total;
      else if (row.status === ExpenseStatusEnum.DUE) totalDue = total;
    }

    const totalExpenses = totalPaid + totalDue;
    const dayOfMonth = now.getUTCDate();
    const avgPerDay = dayOfMonth > 0 ? totalExpenses / dayOfMonth : 0;

    return {
      totalExpenses: totalExpenses.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalDue: totalDue.toFixed(2),
      avgPerDay: avgPerDay.toFixed(2),
    };
  }
}
