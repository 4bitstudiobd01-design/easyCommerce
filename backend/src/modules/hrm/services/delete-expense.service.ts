import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity, ExpenseStatusEnum } from '../entities/expense.entity';

@Injectable()
export class DeleteExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async execute(storeId: string, expenseId: string): Promise<void> {
    const expense = await this.expenseRepository.findOne({ where: { id: expenseId, storeId } });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.status !== ExpenseStatusEnum.PENDING) {
      throw new BadRequestException('Only a pending expense claim can be deleted.');
    }

    await this.expenseRepository.remove(expense);
  }
}
