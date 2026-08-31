import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceAccountEntity } from '../entities/finance-account.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { FinanceTransactionEntity } from '../entities/finance-transaction.entity';
import { QueryFinancialReportDto } from '../dto/financial-reports.dto';
import { resolveDateRange } from './get-profit-loss-report.service';
import {
  FinanceAccountClassEnum,
  FinanceLineTypeEnum,
  FinanceJournalStatusEnum,
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
} from '../enums/finance.enums';

@Injectable()
export class GetCashFlowReportService {
  constructor(
    @InjectRepository(FinanceAccountEntity)
    private readonly accountRepository: Repository<FinanceAccountEntity>,
    @InjectRepository(FinanceJournalLineEntity)
    private readonly journalLineRepository: Repository<FinanceJournalLineEntity>,
    @InjectRepository(FinanceTransactionEntity)
    private readonly transactionRepository: Repository<FinanceTransactionEntity>,
  ) {}

  async execute(storeId: string, query: QueryFinancialReportDto) {
    const { startDate, endDate } = resolveDateRange(query);

    const accounts = await this.accountRepository.find({
      where: { storeId, isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });

    // Check Journal lines for cash/bank accounts (codes starting with 1010, 1020, 1030, 1040)
    const cashLines = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoinAndSelect('jl.journalEntry', 'je')
      .where('jl.storeId = :storeId', { storeId })
      .andWhere('je.status = :status', { status: FinanceJournalStatusEnum.POSTED })
      .andWhere('je.entryDate >= :startDate', { startDate })
      .andWhere('je.entryDate <= :endDate', { endDate })
      .andWhere('(jl.accountCode LIKE :c1 OR jl.accountCode LIKE :c2 OR jl.accountCode LIKE :c3 OR jl.accountCode LIKE :c4)', {
        c1: '1010%',
        c2: '1020%',
        c3: '1030%',
        c4: '1040%',
      })
      .getMany();

    let operatingInflow = 0;
    let operatingOutflow = 0;
    let investingInflow = 0;
    let investingOutflow = 0;
    let financingInflow = 0;
    let financingOutflow = 0;

    if (cashLines.length > 0) {
      for (const line of cashLines) {
        const amt = Number(line.amount || 0);
        const je = line.journalEntry;
        const isDebit = line.type === FinanceLineTypeEnum.DEBIT; // Cash Inflow

        if (je.sourceType === 'MANUAL' && je.description.toLowerCase().includes('capital')) {
          if (isDebit) financingInflow += amt;
          else financingOutflow += amt;
        } else if (je.description.toLowerCase().includes('equipment') || je.description.toLowerCase().includes('asset')) {
          if (isDebit) investingInflow += amt;
          else investingOutflow += amt;
        } else {
          // Standard Operating
          if (isDebit) operatingInflow += amt;
          else operatingOutflow += amt;
        }
      }
    } else {
      // Fallback: Transactions table
      const transactions = await this.transactionRepository
        .createQueryBuilder('txn')
        .where('txn.storeId = :storeId', { storeId })
        .andWhere('txn.status = :status', { status: FinanceTransactionStatusEnum.COMPLETED })
        .andWhere('txn.transactionDate >= :startDate', { startDate })
        .andWhere('txn.transactionDate <= :endDate', { endDate })
        .getMany();

      for (const t of transactions) {
        const amt = Number(t.amount || 0);
        if (t.type === FinanceTransactionTypeEnum.INCOME || t.type === FinanceTransactionTypeEnum.PAYMENT) {
          operatingInflow += amt;
        } else if (t.type === FinanceTransactionTypeEnum.EXPENSE || t.type === FinanceTransactionTypeEnum.REFUND) {
          operatingOutflow += amt;
        }
      }
    }

    const netOperating = Math.round((operatingInflow - operatingOutflow) * 100) / 100;
    const netInvesting = Math.round((investingInflow - investingOutflow) * 100) / 100;
    const netFinancing = Math.round((financingInflow - financingOutflow) * 100) / 100;
    const netCashFlow = Math.round((netOperating + netInvesting + netFinancing) * 100) / 100;

    const currentTotalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance || 0),
      0,
    );

    const beginningCashBalance = Math.max(0, Math.round((currentTotalBalance - netCashFlow) * 100) / 100);

    const accountsSummary = accounts.map((acc) => ({
      accountId: acc.id,
      accountName: acc.name,
      accountType: acc.type,
      currentBalance: Number(acc.currentBalance || 0),
      isDefault: acc.isDefault,
    }));

    return {
      dateRange: { startDate, endDate },
      operatingActivities: {
        cashInflow: Math.round(operatingInflow * 100) / 100,
        cashOutflow: Math.round(operatingOutflow * 100) / 100,
        netCashFlow: netOperating,
      },
      investingActivities: {
        cashInflow: Math.round(investingInflow * 100) / 100,
        cashOutflow: Math.round(investingOutflow * 100) / 100,
        netCashFlow: netInvesting,
      },
      financingActivities: {
        cashInflow: Math.round(financingInflow * 100) / 100,
        cashOutflow: Math.round(financingOutflow * 100) / 100,
        netCashFlow: netFinancing,
      },
      summary: {
        beginningCashBalance,
        netChangeInCash: netCashFlow,
        endingCashBalance: Math.round(currentTotalBalance * 100) / 100,
      },
      accountsSummary,
      currency: 'BDT',
    };
  }
}
