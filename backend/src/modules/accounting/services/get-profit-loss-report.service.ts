import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountTypeEnum } from '../entities/account.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { JournalEntryEntity, JournalStatusEnum } from '../entities/journal-entry.entity';
import { GetAccountingSettingsService } from './get-accounting-settings.service';
import { ProfitLossQueryDto } from '../dto/report.dto';

interface ReportLine {
  accountId: string;
  code: string;
  name: string;
  amount: string;
}

export interface ProfitLossReport {
  period: { from: string; to: string };
  revenue: { total: string; lines: ReportLine[] };
  cogs: { total: string; lines: ReportLine[] };
  grossProfit: string;
  operatingExpenses: { total: string; lines: ReportLine[] };
  netProfit: string;
  netMarginPct: string;
}

/** Parse a numeric string/number into integer cents, guarding against float drift. */
const toCents = (value: string | number | null | undefined): number =>
  Math.round(Number(value ?? 0) * 100);

/** Integer cents → fixed(2) string. */
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

/** "YYYY-MM-DD" for a Date, using its local components. */
const toDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * COGS classification heuristic (best-effort, by chart-of-accounts convention):
 * an EXPENSE account is treated as Cost of Goods Sold when its `code` starts with
 * "5001" (the seeded COGS account) OR its `name` contains "cost of goods" / "cogs"
 * (case-insensitive). Every other EXPENSE account is an operating expense.
 */
const isCogsAccount = (code: string, name: string): boolean => {
  const lowerName = (name ?? '').toLowerCase();
  return (
    (code ?? '').startsWith('5001') ||
    lowerName.includes('cost of goods') ||
    lowerName.includes('cogs')
  );
};

/**
 * Builds the Profit & Loss (income statement) for an inclusive date window.
 *
 * Flow statement: only the movement of REVENUE and EXPENSE accounts inside the window is
 * counted — opening balances are ignored. Only POSTED journal entries contribute; DRAFT
 * and VOID are excluded everywhere, matching the ledger and Chart of Accounts slices.
 *
 * Revenue per account  = Σ(credit − debit) in range.
 * Expense per account   = Σ(debit − credit) in range.
 * Gross Profit          = Revenue − COGS.
 * Net Profit            = Gross Profit − Operating Expenses.
 * Net Margin %          = Net Profit / Revenue × 100 (0 when Revenue is 0).
 */
@Injectable()
export class GetProfitLossReportService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly journalLineRepository: Repository<JournalLineEntity>,
    private readonly getAccountingSettingsService: GetAccountingSettingsService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    query: ProfitLossQueryDto,
  ): Promise<ProfitLossReport> {
    const { from, to } = await this.resolvePeriod(tenantId, storeId, query);

    const accounts = await this.accountRepository.find({
      where: { storeId },
      order: { code: 'ASC' },
    });
    const plAccounts = accounts.filter(
      (a) => a.type === AccountTypeEnum.REVENUE || a.type === AccountTypeEnum.EXPENSE,
    );

    const movementRows = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin(JournalEntryEntity, 'entry', 'entry.id = line.journalEntryId')
      .select('line.accountId', 'accountId')
      .addSelect('COALESCE(SUM(line.debit), 0)', 'debit')
      .addSelect('COALESCE(SUM(line.credit), 0)', 'credit')
      .where('line.storeId = :storeId', { storeId })
      .andWhere('entry.status = :status', { status: JournalStatusEnum.POSTED })
      .andWhere('entry.date >= :from', { from })
      .andWhere('entry.date <= :to', { to })
      .groupBy('line.accountId')
      .getRawMany<{ accountId: string; debit: string; credit: string }>();

    const movementByAccount = new Map(
      movementRows.map((r) => [r.accountId, { debit: toCents(r.debit), credit: toCents(r.credit) }]),
    );

    const revenueLines: ReportLine[] = [];
    const cogsLines: ReportLine[] = [];
    const opexLines: ReportLine[] = [];
    let revenueCents = 0;
    let cogsCents = 0;
    let opexCents = 0;

    for (const account of plAccounts) {
      const movement = movementByAccount.get(account.id) ?? { debit: 0, credit: 0 };

      if (account.type === AccountTypeEnum.REVENUE) {
        const amount = movement.credit - movement.debit;
        if (amount === 0) continue;
        revenueCents += amount;
        revenueLines.push({
          accountId: account.id,
          code: account.code,
          name: account.name,
          amount: fromCents(amount),
        });
      } else {
        const amount = movement.debit - movement.credit;
        if (amount === 0) continue;
        const line: ReportLine = {
          accountId: account.id,
          code: account.code,
          name: account.name,
          amount: fromCents(amount),
        };
        if (isCogsAccount(account.code, account.name)) {
          cogsCents += amount;
          cogsLines.push(line);
        } else {
          opexCents += amount;
          opexLines.push(line);
        }
      }
    }

    const grossProfitCents = revenueCents - cogsCents;
    const netProfitCents = grossProfitCents - opexCents;
    const netMarginPct =
      revenueCents === 0 ? '0.00' : ((netProfitCents / revenueCents) * 100).toFixed(2);

    return {
      period: { from, to },
      revenue: { total: fromCents(revenueCents), lines: revenueLines },
      cogs: { total: fromCents(cogsCents), lines: cogsLines },
      grossProfit: fromCents(grossProfitCents),
      operatingExpenses: { total: fromCents(opexCents), lines: opexLines },
      netProfit: fromCents(netProfitCents),
      netMarginPct,
    };
  }

  /**
   * Resolves the reporting window. An explicit `from`/`to` wins; any missing bound
   * defaults to the fiscal-year-to-date range — the fiscal year containing today per
   * the store's `fiscalYearStartMonth`, through today.
   */
  private async resolvePeriod(
    tenantId: string,
    storeId: string,
    query: ProfitLossQueryDto,
  ): Promise<{ from: string; to: string }> {
    if (query.from && query.to) {
      return { from: query.from, to: query.to };
    }

    const settings = await this.getAccountingSettingsService.execute(tenantId, storeId);
    const fyStartMonth = settings.fiscalYearStartMonth ?? 7; // 1-12
    const now = new Date();
    const startYear =
      now.getMonth() + 1 >= fyStartMonth ? now.getFullYear() : now.getFullYear() - 1;
    const fyStart = new Date(startYear, fyStartMonth - 1, 1);

    return {
      from: query.from ?? toDateString(fyStart),
      to: query.to ?? toDateString(now),
    };
  }
}
