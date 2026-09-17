import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { QueryFinancialReportDto } from '../dto/financial-reports.dto';
import { resolveDateRange } from './get-profit-loss-report.service';
import {
  FinanceLineTypeEnum,
  FinanceJournalStatusEnum,
} from '../enums/finance.enums';
import { SeedDefaultChartOfAccountsService } from './seed-default-chart-of-accounts.service';

@Injectable()
export class GetTrialBalanceReportService {
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

    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      const agg = accountTotalsMap[acc.id] || { debits: 0, credits: 0 };
      const net = agg.debits - agg.credits;

      let debitBalance = 0;
      let creditBalance = 0;

      if (net > 0) {
        debitBalance = Math.round(net * 100) / 100;
      } else if (net < 0) {
        creditBalance = Math.round(Math.abs(net) * 100) / 100;
      }

      totalDebit += debitBalance;
      totalCredit += creditBalance;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        accountClass: acc.accountClass,
        subType: acc.subType,
        normalBalance: acc.normalBalance,
        totalDebits: Math.round(agg.debits * 100) / 100,
        totalCredits: Math.round(agg.credits * 100) / 100,
        debitBalance,
        creditBalance,
      };
    });

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;
    const diff = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;

    return {
      dateRange: { startDate, endDate },
      asOfDate: endDate,
      isBalanced: diff <= 0.01,
      totalDebit,
      totalCredit,
      difference: diff,
      accounts: rows,
      currency: 'BDT',
    };
  }
}
