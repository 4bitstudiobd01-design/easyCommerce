import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceReportQueryDto } from '../dto/finance-query.dto';
import { resolveDateRange } from './get-profit-loss-report.service';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

@Injectable()
export class GetCashFlowReportService {
  constructor(
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
  ) {}

  async execute(storeId: string, query: FinanceReportQueryDto) {
    const { startDate, endDate } = resolveDateRange(query);

    const accounts = await this.accountRepository.find({ where: { storeId, isActive: true } });

    const transactions = await this.transactionRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.account', 'account')
      .leftJoinAndSelect('txn.toAccount', 'toAccount')
      .where('txn.storeId = :storeId', { storeId })
      .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
      .andWhere('txn.transactionDate >= :startDate', { startDate })
      .andWhere('txn.transactionDate <= :endDate', { endDate })
      .orderBy('txn.transactionDate', 'ASC')
      .getMany();

    let totalInflow = 0;
    let totalOutflow = 0;

    const accountBreakdown: Record<
      string,
      {
        accountId: string;
        accountName: string;
        accountType: string;
        inflow: number;
        outflow: number;
        netChange: number;
      }
    > = {};

    for (const acc of accounts) {
      accountBreakdown[acc.id] = {
        accountId: acc.id,
        accountName: acc.name,
        accountType: acc.type,
        inflow: 0,
        outflow: 0,
        netChange: 0,
      };
    }

    for (const t of transactions) {
      const amt = Number(t.amount || 0);

      if (
        t.type === FinanceTransactionTypeEnum.INCOME ||
        t.type === FinanceTransactionTypeEnum.PAYMENT
      ) {
        totalInflow += amt;
        if (t.accountId && accountBreakdown[t.accountId]) {
          accountBreakdown[t.accountId].inflow += amt;
          accountBreakdown[t.accountId].netChange += amt;
        }
      } else if (
        t.type === FinanceTransactionTypeEnum.EXPENSE ||
        t.type === FinanceTransactionTypeEnum.REFUND
      ) {
        totalOutflow += amt;
        if (t.accountId && accountBreakdown[t.accountId]) {
          accountBreakdown[t.accountId].outflow += amt;
          accountBreakdown[t.accountId].netChange -= amt;
        }
      } else if (t.type === FinanceTransactionTypeEnum.TRANSFER) {
        // Internal transfer
        if (t.toAccountId && accountBreakdown[t.toAccountId]) {
          accountBreakdown[t.toAccountId].inflow += amt;
          accountBreakdown[t.toAccountId].netChange += amt;
        }
        if (t.accountId && accountBreakdown[t.accountId]) {
          accountBreakdown[t.accountId].outflow += amt;
          accountBreakdown[t.accountId].netChange -= amt;
        }
      }
    }

    const netCashFlow = totalInflow - totalOutflow;
    const currentTotalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance || 0),
      0,
    );

    return {
      dateRange: { startDate, endDate },
      totalInflow,
      totalOutflow,
      netCashFlow,
      currentTotalBalance,
      accountsSummary: Object.values(accountBreakdown),
      currency: 'BDT',
    };
  }
}
