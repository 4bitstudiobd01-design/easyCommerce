import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity, ExpenseStatusEnum } from '../entities/expense.entity';
import { ReviewExpenseDto } from '../dto/expense.dto';

@Injectable()
export class ReviewExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async execute(storeId: string, expenseId: string, reviewerUserId: string, dto: ReviewExpenseDto): Promise<ExpenseEntity> {
    const expense = await this.expenseRepository.findOne({ where: { id: expenseId, storeId } });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.status !== ExpenseStatusEnum.PENDING) {
      throw new BadRequestException(`This expense has already been ${expense.status.toLowerCase()}.`);
    }

    expense.status = dto.status as ExpenseStatusEnum;
    expense.reviewNote = dto.reviewNote;
    expense.reviewedByUserId = reviewerUserId;
    expense.reviewedAt = new Date();

    return this.expenseRepository.save(expense);
  }
}
