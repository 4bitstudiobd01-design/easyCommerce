import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

@Injectable()
export class DeleteTransactionService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
  ) {}

  async execute(storeId: string, transactionId: string): Promise<void> {
    const txn = await this.transactionRepository.findOne({
      where: { id: transactionId, storeId },
    });

    if (!txn) {
      throw new NotFoundException('Transaction not found.');
    }

    // Revert account balance if completed
    if (txn.accountId && txn.status === FinanceTransactionStatusEnum.COMPLETED) {
      const account = await this.accountRepository.findOne({
        where: { id: txn.accountId, storeId },
      });
      if (account) {
        const current = Number(account.currentBalance || 0);
        const amt = Number(txn.amount || 0);
        if (
          txn.type === FinanceTransactionTypeEnum.INCOME ||
          txn.type === FinanceTransactionTypeEnum.PAYMENT
        ) {
          account.currentBalance = String(current - amt);
        } else if (
          txn.type === FinanceTransactionTypeEnum.EXPENSE ||
          txn.type === FinanceTransactionTypeEnum.REFUND
        ) {
          account.currentBalance = String(current + amt);
        }
        await this.accountRepository.save(account);
      }
    }

    await this.transactionRepository.remove(txn);
  }
}
