import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { DepositToFinanceAccountDto } from '../dto/account.dto';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
  FinanceCategoryTypeEnum,
} from '../enums/finance.enums';
import { SyncModuleFinanceService } from './sync-module-finance.service';

@Injectable()
export class DepositToAccountService {
  private readonly logger = new Logger(DepositToAccountService.name);

  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
    private readonly syncModuleFinanceService: SyncModuleFinanceService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    accountId: string,
    dto: DepositToFinanceAccountDto,
  ): Promise<{ account: FinanceAccountEntity; transaction: FinanceTransactionEntity }> {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than 0.');
    }

    const account = await this.accountRepository.findOne({
      where: { id: accountId, storeId },
    });

    if (!account) {
      throw new NotFoundException('Financial account not found.');
    }

    // 1. Credit target account current balance
    const currentBal = Number(account.currentBalance || 0);
    const newBal = currentBal + dto.amount;
    account.currentBalance = String(newBal);
    const updatedAccount = await this.accountRepository.save(account);

    // 2. Resolve category
    const categoryCode = dto.categoryCode || 'CAPITAL_INJECTION';
    let category = await this.categoryRepository.findOne({
      where: { storeId, code: categoryCode },
    });

    if (!category) {
      category = this.categoryRepository.create({
        tenantId,
        storeId,
        name: dto.source || 'Fund Deposit / Capital',
        code: categoryCode,
        type: FinanceCategoryTypeEnum.INCOME,
        isSystem: true,
      });
      category = await this.categoryRepository.save(category);
    }

    // 3. Generate transaction reference and record
    const count = await this.transactionRepository.count({ where: { storeId } });
    const transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;
    const transactionDate = dto.depositDate || new Date().toISOString().split('T')[0];
    const sourceLabel = dto.source ? ` (${dto.source})` : '';

    const txn = this.transactionRepository.create({
      tenantId,
      storeId,
      transactionNumber,
      type: FinanceTransactionTypeEnum.INCOME,
      amount: String(dto.amount),
      currency: account.currency || 'BDT',
      transactionDate,
      accountId: account.id,
      categoryId: category.id,
      categoryCode: category.code,
      description: dto.notes || `Money added to ${account.name}${sourceLabel}`,
      reference: dto.reference || `DEP-${Date.now().toString().slice(-6)}`,
      sourceType: FinanceSourceTypeEnum.MANUAL,
      paymentMethod: dto.paymentMethod || 'CASH',
      status: FinanceTransactionStatusEnum.COMPLETED,
      createdByUserId: userId,
    });

    const savedTxn = await this.transactionRepository.save(txn);

    // 4. Auto-sync double-entry journal entry
    try {
      await this.syncModuleFinanceService.syncIncomeTransaction({
        tenantId,
        storeId,
        transactionNumber: savedTxn.transactionNumber,
        amount: dto.amount,
        transactionDate,
        categoryCode: savedTxn.categoryCode,
        description: savedTxn.description,
        accountId: account.id,
      });
    } catch (err) {
      this.logger.error(`Failed to auto-sync double-entry for deposit ${transactionNumber}:`, err);
    }

    return {
      account: updatedAccount,
      transaction: savedTxn,
    };
  }
}
