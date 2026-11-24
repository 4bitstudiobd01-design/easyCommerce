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

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1-12
    const curMonthStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;

    const prevDate = new Date(curYear, curMonth - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    let thisMonthCredit = 0;
    let thisMonthDebit = 0;
    let lastMonthCredit = 0;
    let lastMonthDebit = 0;

    for (const t of transactions) {
      if (t.status !== FinanceTransactionStatusEnum.COMPLETED) continue;
      const amt = Number(t.amount || 0);
      const tMonth = (t.transactionDate || '').substring(0, 7);

      if (t.type === FinanceTransactionTypeEnum.TRANSFER) {
        if (t.toAccountId === accountId) {
          totalInflow += amt;
          if (tMonth === curMonthStr) thisMonthCredit += amt;
          else if (tMonth === prevMonthStr) lastMonthCredit += amt;
        } else if (t.accountId === accountId) {
          totalOutflow += amt;
          if (tMonth === curMonthStr) thisMonthDebit += amt;
          else if (tMonth === prevMonthStr) lastMonthDebit += amt;
        }
      } else if (
        t.type === FinanceTransactionTypeEnum.INCOME ||
        t.type === FinanceTransactionTypeEnum.PAYMENT
      ) {
        totalInflow += amt;
        if (tMonth === curMonthStr) thisMonthCredit += amt;
        else if (tMonth === prevMonthStr) lastMonthCredit += amt;
      } else if (
        t.type === FinanceTransactionTypeEnum.EXPENSE ||
        t.type === FinanceTransactionTypeEnum.REFUND
      ) {
        totalOutflow += amt;
        if (tMonth === curMonthStr) thisMonthDebit += amt;
        else if (tMonth === prevMonthStr) lastMonthDebit += amt;
      }
    }

    const curBal = Number(account.currentBalance || 0);
    const lastMonthBalance = Math.max(0, Math.round((curBal - (thisMonthCredit - thisMonthDebit)) * 100) / 100);

    return {
      account,
      transactions,
      summary: {
        startingBalance: Number(account.startingBalance || 0),
        currentBalance: curBal,
        totalInflow: Math.round(totalInflow * 100) / 100,
        totalOutflow: Math.round(totalOutflow * 100) / 100,
        thisMonthCredit: Math.round(thisMonthCredit * 100) / 100,
        thisMonthDebit: Math.round(thisMonthDebit * 100) / 100,
        lastMonthCredit: Math.round(lastMonthCredit * 100) / 100,
        lastMonthDebit: Math.round(lastMonthDebit * 100) / 100,
        lastMonthBalance,
      },
    };
  }
}
