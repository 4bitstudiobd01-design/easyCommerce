import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountTypeEnum } from '../entities/account.entity';
import {
  AccountMappingEntity,
  AccountMappingEventEnum,
} from '../entities/account-mapping.entity';
import {
  ExpenseEntity,
  ExpenseStatusEnum,
} from '../entities/expense.entity';
import { JournalSourceEnum, JournalStatusEnum } from '../entities/journal-entry.entity';
import { NumberingDocTypeEnum } from '../entities/numbering-rule.entity';
import { CreateExpenseDto } from '../dto/expense.dto';
import { AllocateNextNumberService } from './allocate-next-number.service';
import { PostJournalEntryService } from './post-journal-entry.service';

/**
 * Records an operating expense and books it to the ledger in one balanced journal entry.
 *
 *   DEBIT  expense account            (the chosen EXPENSE account)
 *   CREDIT paid-from account          (when PAID — a Cash/Bank ASSET account)
 *   CREDIT Accounts Payable           (when DUE — from the AP account mapping)
 *
 * The entry is posted through PostJournalEntryService with source EXPENSE + sourceRef
 * = expense.id, so it is idempotent and shows up on the ledger, COA tree and reports.
 */
@Injectable()
export class CreateExpenseService {
  constructor(
    @InjectRepository(ExpenseEntity)
    private readonly expenseRepository: Repository<ExpenseEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(AccountMappingEntity)
    private readonly mappingRepository: Repository<AccountMappingEntity>,
    private readonly allocateNextNumberService: AllocateNextNumberService,
    private readonly postJournalEntryService: PostJournalEntryService,
  ) {}

  private async requireAccount(
    storeId: string,
    accountId: string,
    type: AccountTypeEnum,
    label: string,
  ): Promise<AccountEntity> {
    const account = await this.accountRepository.findOne({ where: { id: accountId, storeId } });
    if (!account) {
      throw new NotFoundException(`${label} not found in this store.`);
    }
    if (account.type !== type) {
      throw new BadRequestException(`${label} must be a ${type} account.`);
    }
    return account;
  }

  private async resolveMappedAccountId(
    storeId: string,
    event: AccountMappingEventEnum,
  ): Promise<string | undefined> {
    const mapping = await this.mappingRepository.findOne({ where: { storeId, event } });
    return mapping?.accountId ?? undefined;
  }

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateExpenseDto,
    userId: string,
  ): Promise<ExpenseEntity> {
    if (dto.expenseAccountId) {
      await this.requireAccount(
        storeId,
        dto.expenseAccountId,
        AccountTypeEnum.EXPENSE,
        'Expense account',
      );
    }
    if (dto.paidFromAccountId) {
      await this.requireAccount(
        storeId,
        dto.paidFromAccountId,
        AccountTypeEnum.ASSET,
        'Paid-from account',
      );
    }

    // Resolve the debit (expense) account: explicit choice first, then a sensible default.
    const debitAccountId = dto.expenseAccountId;
    if (!debitAccountId) {
      throw new BadRequestException('Select an expense account.');
    }

    // Resolve the credit account.
    let creditAccountId: string | undefined;
    if (dto.status === ExpenseStatusEnum.PAID) {
      creditAccountId =
        dto.paidFromAccountId ??
        (await this.resolveMappedAccountId(storeId, AccountMappingEventEnum.CASH));
      if (!creditAccountId) {
        throw new BadRequestException('Select the account this expense was paid from.');
      }
    } else {
      creditAccountId = await this.resolveMappedAccountId(
        storeId,
        AccountMappingEventEnum.ACCOUNTS_PAYABLE,
      );
      if (!creditAccountId) {
        throw new BadRequestException('Configure the Accounts Payable mapping.');
      }
    }

    const expenseNumber = await this.allocateNextNumberService.execute(
      tenantId,
      storeId,
      NumberingDocTypeEnum.EXPENSE,
    );

    const amount = dto.amount.toFixed(2);

    const expense = await this.expenseRepository.save(
      this.expenseRepository.create({
        tenantId,
        storeId,
        expenseNumber,
        date: dto.date,
        title: dto.title,
        note: dto.note,
        category: dto.category,
        vendor: dto.vendor,
        amount,
        paymentMethod: dto.paymentMethod,
        status: dto.status,
        expenseAccountId: debitAccountId,
        paidFromAccountId:
          dto.status === ExpenseStatusEnum.PAID ? creditAccountId : undefined,
        createdByUserId: userId,
      }),
    );

    const journalEntry = await this.postJournalEntryService.execute(tenantId, storeId, {
      date: dto.date,
      description: `Expense ${expenseNumber} — ${dto.title}`,
      status: JournalStatusEnum.POSTED,
      source: JournalSourceEnum.EXPENSE,
      sourceRef: expense.id,
      createdByUserId: userId,
      lines: [
        { accountId: debitAccountId, debit: dto.amount, memo: dto.title },
        { accountId: creditAccountId, credit: dto.amount, memo: dto.title },
      ],
    });

    expense.journalEntryId = journalEntry.id;
    return this.expenseRepository.save(expense);
  }
}
