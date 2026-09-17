import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity, ExpenseStatusEnum } from '../entities/expense.entity';
import { ReviewExpenseDto } from '../dto/expense.dto';
import { RecordSyncedFinanceTransactionService } from '../../finance/services/record-synced-finance-transaction.service';
import {
  FinanceTransactionTypeEnum,
  FinanceSourceTypeEnum,
} from '../../finance/enums/finance.enums';

@Injectable()
export class ReviewExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    @Optional()
    private readonly recordSyncedFinanceTransactionService?: RecordSyncedFinanceTransactionService,
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

    const saved = await this.expenseRepository.save(expense);

    // Sync to Finance module if approved
    if (dto.status === ExpenseStatusEnum.APPROVED && this.recordSyncedFinanceTransactionService) {
      try {
        await this.recordSyncedFinanceTransactionService.execute({
          tenantId: expense.tenantId,
          storeId: expense.storeId,
          type: FinanceTransactionTypeEnum.EXPENSE,
          amount: Number(expense.amount || 0),
          currency: expense.currency || 'BDT',
          transactionDate: expense.expenseDate || new Date().toISOString().split('T')[0],
          categoryCode: 'EMPLOYEE_EXPENSE',
          categoryName: 'Employee Expenses',
          description: `HR Expense: ${expense.description || expense.category}`,
          reference: `EXP-${expense.id.substring(0, 8).toUpperCase()}`,
          sourceType: FinanceSourceTypeEnum.HR_EXPENSE,
          sourceId: expense.id,
        });
      } catch (err) {
        // Non-blocking log
        console.error('Failed to sync approved HR expense to Finance:', err);
      }
    }

    return saved;
  }
}

