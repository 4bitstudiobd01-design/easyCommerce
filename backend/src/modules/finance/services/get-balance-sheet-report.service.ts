import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { QueryFinancialReportDto } from '../dto/financial-reports.dto';
import { resolveDateRange } from './get-profit-loss-report.service';
import {
  FinanceAccountClassEnum,
  FinanceLineTypeEnum,
  FinanceJournalStatusEnum,
} from '../enums/finance.enums';
import { SeedDefaultChartOfAccountsService } from './seed-default-chart-of-accounts.service';

@Injectable()
export class GetBalanceSheetReportService {
  constructor(
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
    @InjectRepository(FinanceJournalLineEntity)
    private readonly journalLineRepository: Repository<FinanceJournalLineEntity>,
    private readonly seederService: SeedDefaultChartOfAccountsService,
  ) {}

  async execute(tenantId: string, storeId: string, query: QueryFinancialReportDto) {
    await this.seederService.execute(tenantId, storeId);
    const { startDate, endDate } = resolveDateRange(query);

    const accounts = await this.coaRepository.find({
      where: { storeId, isActive: true },
      order: { code: 'ASC' },
    });

    const linesAgg = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoin('jl.journalEntry', 'je')
      .where('jl.storeId = :storeId', { storeId })
      .andWhere('je.status = :status', { status: FinanceJournalStatusEnum.POSTED })
      .andWhere('je.entryDate <= :endDate', { endDate })
      .select('jl.accountId', 'accountId')
      .addSelect('jl.type', 'type')
      .addSelect('SUM(CAST(jl.amount AS decimal))', 'total')
      .groupBy('jl.accountId')
      .addGroupBy('jl.type')
      .getRawMany();

    const accountTotalsMap: Record<string, { debits: number; credits: number }> = {};
    for (const row of linesAgg) {
      if (!accountTotalsMap[row.accountId]) {
        accountTotalsMap[row.accountId] = { debits: 0, credits: 0 };
      }
      const val = Number(row.total || 0);
      if (row.type === FinanceLineTypeEnum.DEBIT) {
        accountTotalsMap[row.accountId].debits += val;
      } else if (row.type === FinanceLineTypeEnum.CREDIT) {
        accountTotalsMap[row.accountId].credits += val;
      }
    }

    const currentAssets: Array<{ id: string; code: string; name: string; balance: number }> = [];
    const nonCurrentAssets: Array<{ id: string; code: string; name: string; balance: number }> = [];
    const currentLiabilities: Array<{ id: string; code: string; name: string; balance: number }> = [];
    const longTermLiabilities: Array<{ id: string; code: string; name: string; balance: number }> = [];
    const equityItems: Array<{ id: string; code: string; name: string; balance: number }> = [];

    let totalRevenue = 0;
    let totalExpense = 0;

    for (const acc of accounts) {
      const agg = accountTotalsMap[acc.id] || { debits: 0, credits: 0 };
      let bal = 0;

      if (acc.accountClass === FinanceAccountClassEnum.ASSET) {
        bal = agg.debits - agg.credits;
        const item = { id: acc.id, code: acc.code, name: acc.name, balance: Math.round(bal * 100) / 100 };
        if (acc.subType === 'NON_CURRENT_ASSET') {
          nonCurrentAssets.push(item);
        } else {
          currentAssets.push(item);
        }
      } else if (acc.accountClass === FinanceAccountClassEnum.LIABILITY) {
        bal = agg.credits - agg.debits;
        const item = { id: acc.id, code: acc.code, name: acc.name, balance: Math.round(bal * 100) / 100 };
        if (acc.subType === 'LONG_TERM_LIABILITY') {
          longTermLiabilities.push(item);
        } else {
          currentLiabilities.push(item);
        }
      } else if (acc.accountClass === FinanceAccountClassEnum.EQUITY) {
        bal = agg.credits - agg.debits;
        equityItems.push({ id: acc.id, code: acc.code, name: acc.name, balance: Math.round(bal * 100) / 100 });
      } else if (acc.accountClass === FinanceAccountClassEnum.REVENUE) {
        // Revenue is Credit normal
        totalRevenue += (agg.credits - agg.debits);
      } else if (acc.accountClass === FinanceAccountClassEnum.EXPENSE) {
        // Expense is Debit normal
        totalExpense += (agg.debits - agg.credits);
      }
    }

    const currentPeriodNetIncome = Math.round((totalRevenue - totalExpense) * 100) / 100;

    const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.balance, 0);
    const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, item) => sum + item.balance, 0);
    const totalAssets = Math.round((totalCurrentAssets + totalNonCurrentAssets) * 100) / 100;

    const totalCurrentLiabilities = currentLiabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalLongTermLiabilities = longTermLiabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = Math.round((totalCurrentLiabilities + totalLongTermLiabilities) * 100) / 100;

    const baseEquity = equityItems.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = Math.round((baseEquity + currentPeriodNetIncome) * 100) / 100;

    const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;
    const difference = Math.round(Math.abs(totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

    return {
      asOfDate: endDate,
      dateRange: { startDate, endDate },
      assets: {
        currentAssets,
        totalCurrentAssets: Math.round(totalCurrentAssets * 100) / 100,
        nonCurrentAssets,
        totalNonCurrentAssets: Math.round(totalNonCurrentAssets * 100) / 100,
        totalAssets,
      },
      liabilities: {
        currentLiabilities,
        totalCurrentLiabilities: Math.round(totalCurrentLiabilities * 100) / 100,
        longTermLiabilities,
        totalLongTermLiabilities: Math.round(totalLongTermLiabilities * 100) / 100,
        totalLiabilities,
      },
      equity: {
        equityItems,
        baseEquity: Math.round(baseEquity * 100) / 100,
        currentPeriodNetIncome,
        totalEquity,
      },
      totalLiabilitiesAndEquity,
      isBalanced: difference <= 0.01,
      difference,
      currency: 'BDT',
    };
  }
}
