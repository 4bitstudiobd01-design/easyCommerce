import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity, ExpenseStatusEnum } from '../entities/expense.entity';

@Injectable()
export class MarkExpenseReimbursedService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async execute(storeId: string, expenseId: string): Promise<ExpenseEntity> {
    const expense = await this.expenseRepository.findOne({ where: { id: expenseId, storeId } });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.status !== ExpenseStatusEnum.APPROVED) {
      throw new BadRequestException('Only an approved expense can be marked as reimbursed.');
    }

    expense.status = ExpenseStatusEnum.REIMBURSED;
    expense.reimbursedAt = new Date();

    return this.expenseRepository.save(expense);
  }
}
