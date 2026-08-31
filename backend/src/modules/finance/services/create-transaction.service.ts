import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { CreateFinanceTransactionDto } from '../dto/transaction.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';
import { SyncModuleFinanceService } from './sync-module-finance.service';

@Injectable()
export class CreateTransactionService {
  private readonly logger = new Logger(CreateTransactionService.name);

  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
    private readonly syncModuleFinanceService: SyncModuleFinanceService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    dto: CreateFinanceTransactionDto,
  ): Promise<FinanceTransactionEntity> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Transaction amount must be greater than 0.');
    }

    let account: FinanceAccountEntity | null = null;
    if (dto.accountId) {
      account = await this.accountRepository.findOne({
        where: { id: dto.accountId, storeId },
      });
      if (!account) {
        throw new BadRequestException('Specified financial account not found.');
      }
    }

    let category: FinanceCategoryEntity | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, storeId },
      });
    } else if (dto.categoryCode) {
      category = await this.categoryRepository.findOne({
        where: { code: dto.categoryCode, storeId },
      });
    }

    const count = await this.transactionRepository.count({ where: { storeId } });
    const transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;
    const transactionDate = dto.transactionDate || new Date().toISOString().split('T')[0];

    const txn = this.transactionRepository.create({
      tenantId,
      storeId,
      transactionNumber,
      type: dto.type,
      amount: String(dto.amount),
      currency: dto.currency || 'BDT',
      transactionDate,
      accountId: dto.accountId || null,
      toAccountId: dto.toAccountId || null,
      categoryId: dto.categoryId || category?.id || null,
      categoryCode: dto.categoryCode || category?.code || 'OTHER',
      description: dto.description || null,
      reference: dto.reference || null,
      sourceType: dto.sourceType || FinanceSourceTypeEnum.MANUAL,
      sourceId: dto.sourceId || null,
      paymentMethod: dto.paymentMethod || null,
      status: dto.status || FinanceTransactionStatusEnum.COMPLETED,
      receiptFileId: dto.receiptFileId || null,
      createdByUserId: userId || null,
    });

    const savedTxn = await this.transactionRepository.save(txn);

    // Update account balance if transaction is completed and account linked
    if (account && savedTxn.status === FinanceTransactionStatusEnum.COMPLETED) {
      const current = Number(account.currentBalance || 0);
      if (
        dto.type === FinanceTransactionTypeEnum.INCOME ||
        dto.type === FinanceTransactionTypeEnum.PAYMENT
      ) {
        account.currentBalance = String(current + dto.amount);
      } else if (
        dto.type === FinanceTransactionTypeEnum.EXPENSE ||
        dto.type === FinanceTransactionTypeEnum.REFUND
      ) {
        account.currentBalance = String(current - dto.amount);
      } else if (dto.type === FinanceTransactionTypeEnum.ADJUSTMENT) {
        account.currentBalance = String(dto.amount);
      }
      await this.accountRepository.save(account);
    }

    // Auto-sync into Double-Entry Journal Entry
    try {
      if (savedTxn.type === FinanceTransactionTypeEnum.EXPENSE) {
        await this.syncModuleFinanceService.syncExpenseTransaction({
          tenantId,
          storeId,
          transactionNumber: savedTxn.transactionNumber,
          amount: dto.amount,
          transactionDate,
          categoryCode: savedTxn.categoryCode,
          description: savedTxn.description,
          paymentMethod: savedTxn.paymentMethod,
          accountId: savedTxn.accountId,
        });
      } else if (savedTxn.type === FinanceTransactionTypeEnum.INCOME) {
        await this.syncModuleFinanceService.syncIncomeTransaction({
          tenantId,
          storeId,
          transactionNumber: savedTxn.transactionNumber,
          amount: dto.amount,
          transactionDate,
          categoryCode: savedTxn.categoryCode,
          description: savedTxn.description,
          accountId: savedTxn.accountId,
        });
      }
    } catch (err) {
      this.logger.error(`Failed to auto-sync double entry for transaction ${savedTxn.transactionNumber}:`, err);
    }

    return savedTxn;
  }
}
