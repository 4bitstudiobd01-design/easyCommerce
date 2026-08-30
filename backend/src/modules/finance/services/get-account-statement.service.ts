import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

@Injectable()
export class GetAccountStatementService {
  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async execute(storeId: string, accountId: string) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, storeId },
    });

    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    const transactions = await this.transactionRepository.find({
      where: [
        { storeId, accountId },
        { storeId, toAccountId: accountId },
      ],
      relations: ['category'],
      order: { transactionDate: 'DESC', createdAt: 'DESC' },
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    for (const t of transactions) {
      if (t.status !== FinanceTransactionStatusEnum.COMPLETED) continue;
      const amt = Number(t.amount || 0);

      if (t.type === FinanceTransactionTypeEnum.TRANSFER) {
        if (t.toAccountId === accountId) {
          totalInflow += amt;
        } else if (t.accountId === accountId) {
          totalOutflow += amt + Number(t.reference === 'fee' ? 0 : 0);
        }
      } else if (
        t.type === FinanceTransactionTypeEnum.INCOME ||
        t.type === FinanceTransactionTypeEnum.PAYMENT
      ) {
        totalInflow += amt;
      } else if (
        t.type === FinanceTransactionTypeEnum.EXPENSE ||
        t.type === FinanceTransactionTypeEnum.REFUND
      ) {
        totalOutflow += amt;
      }
    }

    return {
      account,
      transactions,
      summary: {
        startingBalance: Number(account.startingBalance || 0),
        currentBalance: Number(account.currentBalance || 0),
        totalInflow,
        totalOutflow,
      },
    };
  }
}
