import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { GeneralLedgerQueryDto } from '../dto/financial-reports.dto';
import {
  FinanceLineTypeEnum,
  FinanceNormalBalanceEnum,
  FinanceJournalStatusEnum,
} from '../enums/finance.enums';
import { getLocalTodayYmd } from '../utils/finance-date.utils';

@Injectable()
export class GetGeneralLedgerService {
  constructor(
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
    @InjectRepository(FinanceJournalLineEntity)
    private readonly journalLineRepository: Repository<FinanceJournalLineEntity>,
  ) {}

  async execute(storeId: string, query: GeneralLedgerQueryDto) {
    const account = await this.coaRepository.findOne({
      where: { id: query.accountId, storeId },
    });

    if (!account) {
      throw new NotFoundException(`Chart of Account with ID "${query.accountId}" not found.`);
    }

    const startDate = query.startDate || '1970-01-01';
    const endDate = query.endDate || getLocalTodayYmd();

    // 1. Calculate Opening Balance prior to startDate
    let openingBalance = 0;
    if (query.startDate && query.startDate > '1970-01-01') {
      const priorLines = await this.journalLineRepository
        .createQueryBuilder('jl')
        .innerJoin('jl.journalEntry', 'je')
        .where('jl.storeId = :storeId', { storeId })
        .andWhere('jl.accountId = :accountId', { accountId: account.id })
        .andWhere('je.status = :status', { status: FinanceJournalStatusEnum.POSTED })
        .andWhere('je.entryDate < :startDate', { startDate: query.startDate })
        .select('jl.type', 'type')
        .addSelect('SUM(CAST(jl.amount AS decimal))', 'total')
        .groupBy('jl.type')
        .getRawMany();

      let priorDebits = 0;
      let priorCredits = 0;

      for (const row of priorLines) {
        if (row.type === FinanceLineTypeEnum.DEBIT) {
          priorDebits = Number(row.total || 0);
        } else if (row.type === FinanceLineTypeEnum.CREDIT) {
          priorCredits = Number(row.total || 0);
        }
      }

      if (account.normalBalance === FinanceNormalBalanceEnum.DEBIT) {
        openingBalance = priorDebits - priorCredits;
      } else {
        openingBalance = priorCredits - priorDebits;
      }
    }

    // 2. Fetch Transactions in period
    const lines = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoinAndSelect('jl.journalEntry', 'je')
      .where('jl.storeId = :storeId', { storeId })
      .andWhere('jl.accountId = :accountId', { accountId: account.id })
      .andWhere('je.status = :status', { status: FinanceJournalStatusEnum.POSTED })
      .andWhere('je.entryDate >= :startDate', { startDate })
      .andWhere('je.entryDate <= :endDate', { endDate })
      .orderBy('je.entryDate', 'ASC')
      .addOrderBy('je.createdAt', 'ASC')
      .getMany();

    // 3. Compute running balances and period totals
    let periodDebits = 0;
    let periodCredits = 0;
    let currentRunning = openingBalance;

    const ledgerItems = lines.map((line) => {
      const amt = Number(line.amount || 0);
      const isDebit = line.type === FinanceLineTypeEnum.DEBIT;
      const debitAmt = isDebit ? amt : 0;
      const creditAmt = !isDebit ? amt : 0;

      periodDebits += debitAmt;
      periodCredits += creditAmt;

      if (account.normalBalance === FinanceNormalBalanceEnum.DEBIT) {
        currentRunning += debitAmt - creditAmt;
      } else {
        currentRunning += creditAmt - debitAmt;
      }

      return {
        id: line.id,
        entryDate: line.journalEntry.entryDate,
        entryNumber: line.journalEntry.entryNumber,
        sourceType: line.journalEntry.sourceType,
        sourceReference: line.journalEntry.sourceReference,
        description: line.description || line.journalEntry.description,
        partyType: line.partyType,
        partyName: line.partyName,
        debit: debitAmt,
        credit: creditAmt,
        runningBalance: Math.round(currentRunning * 100) / 100,
      };
    });

    const closingBalance = Math.round(currentRunning * 100) / 100;

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        accountClass: account.accountClass,
        subType: account.subType,
        normalBalance: account.normalBalance,
        currency: account.currency,
      },
      dateRange: { startDate, endDate },
      openingBalance: Math.round(openingBalance * 100) / 100,
      closingBalance,
      periodDebits: Math.round(periodDebits * 100) / 100,
      periodCredits: Math.round(periodCredits * 100) / 100,
      transactions: ledgerItems,
    };
  }
}
