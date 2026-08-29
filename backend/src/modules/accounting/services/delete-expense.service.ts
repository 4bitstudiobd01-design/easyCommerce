import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../entities/expense.entity';
import {
  JournalEntryEntity,
  JournalStatusEnum,
} from '../entities/journal-entry.entity';

/**
 * Deletes an expense. If it already posted a journal entry, that entry is voided (its
 * rows and lines stay in the ledger for audit; status flips to VOID so the ledger, COA
 * tree and reports stop counting it) before the expense row is removed.
 */
@Injectable()
export class DeleteExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepository: Repository<JournalEntryEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
    _userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const expense = await this.expenseRepository.findOne({ where: { id, storeId } });
    if (!expense) {
      throw new NotFoundException('Expense not found.');
    }

    if (expense.journalEntryId) {
      const entry = await this.journalRepository.findOne({
        where: { id: expense.journalEntryId, storeId },
      });
      if (entry && entry.status !== JournalStatusEnum.VOID) {
        entry.status = JournalStatusEnum.VOID;
        await this.journalRepository.save(entry);
      }
    }

    await this.expenseRepository.remove(expense);

    return {
      success: true,
      message: `Expense ${expense.expenseNumber} deleted and its journal entry voided.`,
    };
  }
}
