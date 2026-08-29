import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../entities/expense.entity';
import { UpdateExpenseDto } from '../dto/expense.dto';

/**
 * Edits an expense. Once an expense has posted its journal entry, only descriptive
 * metadata (title, note, category, vendor, receiptUrl) may change — anything that would
 * move the ledger (amount, date, accounts, payment method, status) is rejected. To change
 * those, delete the expense (which voids its entry) and record a new one.
 */
@Injectable()
export class UpdateExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
    dto: UpdateExpenseDto,
    userId: string,
  ): Promise<ExpenseEntity> {
    const expense = await this.expenseRepository.findOne({ where: { id, storeId } });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    const touchesLedger =
      dto.amount !== undefined ||
      dto.date !== undefined ||
      dto.expenseAccountId !== undefined ||
      dto.paidFromAccountId !== undefined ||
      dto.paymentMethod !== undefined ||
      dto.status !== undefined;

    if (expense.journalEntryId && touchesLedger) {
      throw new BadRequestException(
        'Amount and posting fields cannot be changed after an expense is booked. Delete and re-create instead.',
      );
    }

    if (dto.title !== undefined) expense.title = dto.title;
    if (dto.note !== undefined) expense.note = dto.note;
    if (dto.category !== undefined) expense.category = dto.category;
    if (dto.vendor !== undefined) expense.vendor = dto.vendor;
    if (dto.receiptUrl !== undefined) expense.receiptUrl = dto.receiptUrl;

    if (!expense.journalEntryId) {
      if (dto.date !== undefined) expense.date = dto.date;
      if (dto.amount !== undefined) expense.amount = dto.amount.toFixed(2);
      if (dto.paymentMethod !== undefined) expense.paymentMethod = dto.paymentMethod;
      if (dto.status !== undefined) expense.status = dto.status;
      if (dto.expenseAccountId !== undefined) expense.expenseAccountId = dto.expenseAccountId;
      if (dto.paidFromAccountId !== undefined) expense.paidFromAccountId = dto.paidFromAccountId;
    }

    expense.createdByUserId = expense.createdByUserId ?? userId;
    return this.expenseRepository.save(expense);
  }
}
