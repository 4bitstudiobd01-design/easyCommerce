import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
  FinanceCategoryTypeEnum,
} from '../enums/finance.enums';

export interface SyncedFinanceTransactionPayload {
  tenantId: string;
  storeId: string;
  type: FinanceTransactionTypeEnum;
  amount: number;
  currency?: string;
  transactionDate?: string;
  categoryCode: string;
  categoryName?: string;
  description?: string;
  reference?: string;
  sourceType: FinanceSourceTypeEnum;
  sourceId: string;
  paymentMethod?: string;
  accountId?: string;
}

@Injectable()
export class RecordSyncedFinanceTransactionService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
  ) {}

  async execute(payload: SyncedFinanceTransactionPayload): Promise<FinanceTransactionEntity> {
    // Check if a transaction for this source already exists to avoid duplicate entries
    const existing = await this.transactionRepository.findOne({
      where: {
        storeId: payload.storeId,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
      },
    });

    if (existing) {
      existing.amount = String(payload.amount);
      existing.description = payload.description || existing.description;
      existing.reference = payload.reference || existing.reference;
      existing.paymentMethod = payload.paymentMethod || existing.paymentMethod;
      return this.transactionRepository.save(existing);
    }

    // Resolve or create category if needed
    let category = await this.categoryRepository.findOne({
      where: { storeId: payload.storeId, code: payload.categoryCode },
    });

    if (!category) {
      category = this.categoryRepository.create({
        tenantId: payload.tenantId,
        storeId: payload.storeId,
        name: payload.categoryName || payload.categoryCode.replace('_', ' '),
        code: payload.categoryCode,
        type:
          payload.type === FinanceTransactionTypeEnum.INCOME
            ? FinanceCategoryTypeEnum.INCOME
            : FinanceCategoryTypeEnum.EXPENSE,
        isSystem: true,
      });
      category = await this.categoryRepository.save(category);
    }

    // Resolve target account if not explicitly passed
    let accountId = payload.accountId;
    if (!accountId) {
      const defaultAccount = await this.accountRepository.findOne({
        where: { storeId: payload.storeId, isDefault: true, isActive: true },
      });
      if (defaultAccount) {
        accountId = defaultAccount.id;
      }
    }

    // Generate unique transaction number
    const count = await this.transactionRepository.count({
      where: { storeId: payload.storeId },
    });
    const txnNumber = `TXN-${String(count + 1).padStart(6, '0')}`;

    const txn = this.transactionRepository.create({
      tenantId: payload.tenantId,
      storeId: payload.storeId,
      transactionNumber: txnNumber,
      type: payload.type,
      amount: String(payload.amount),
      currency: payload.currency || 'BDT',
      transactionDate: payload.transactionDate || new Date().toISOString().split('T')[0],
      accountId,
      categoryId: category?.id,
      categoryCode: payload.categoryCode,
      description: payload.description,
      reference: payload.reference,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      paymentMethod: payload.paymentMethod,
      status: FinanceTransactionStatusEnum.COMPLETED,
    });

    const savedTxn = await this.transactionRepository.save(txn);

    // Update account balance if account is linked
    if (accountId) {
      const account = await this.accountRepository.findOne({ where: { id: accountId } });
      if (account) {
        const current = Number(account.currentBalance || 0);
        if (payload.type === FinanceTransactionTypeEnum.INCOME) {
          account.currentBalance = String(current + payload.amount);
        } else if (payload.type === FinanceTransactionTypeEnum.EXPENSE) {
          account.currentBalance = String(current - payload.amount);
        }
        await this.accountRepository.save(account);
      }
    }

    return savedTxn;
  }
}
