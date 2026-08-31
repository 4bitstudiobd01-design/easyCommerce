import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class CreateTransactionService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
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
    }

    const count = await this.transactionRepository.count({ where: { storeId } });
    const transactionNumber = `TXN-${String(count + 1).padStart(6, '0')}`;

    const txn = this.transactionRepository.create({
      tenantId,
      storeId,
      transactionNumber,
      type: dto.type,
      amount: String(dto.amount),
      currency: dto.currency || 'BDT',
      transactionDate: dto.transactionDate,
      accountId: dto.accountId,
      toAccountId: dto.toAccountId,
      categoryId: dto.categoryId || category?.id,
      categoryCode: dto.categoryCode || category?.code,
      description: dto.description,
      reference: dto.reference,
      sourceType: dto.sourceType || FinanceSourceTypeEnum.MANUAL,
      sourceId: dto.sourceId,
      paymentMethod: dto.paymentMethod,
      status: dto.status || FinanceTransactionStatusEnum.COMPLETED,
      receiptFileId: dto.receiptFileId,
      createdByUserId: userId,
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

    return savedTxn;
  }
}
