import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountTypeEnum } from '../entities/account.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { JournalEntryEntity, JournalStatusEnum } from '../entities/journal-entry.entity';
import { AccountingOverviewQueryDto } from '../dto/overview.dto';
import { GetProfitLossReportService } from './get-profit-loss-report.service';
import { ListJournalEntriesService } from './list-journal-entries.service';

interface OverviewPeriod {
  from: string;
  to: string;
}

interface OverviewTrendPoint {
  date: string;
  revenue: string;
  expenses: string;
}

interface OverviewOutstandingLine {
  amount: string;
  accountCount: number;
}

interface OverviewRecentTransaction {
  id: string;
  date: string;
  description: string;
  account: string;
  type: 'Income' | 'Expense';
  amount: string;
  status: string;
}

export interface AccountingOverview {
  period: OverviewPeriod;
  kpis: {
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    cashBalance: string;
  };
  comparison: {
    previousPeriod: OverviewPeriod;
    revenueChangePct: string;
    expensesChangePct: string;
    netProfitChangePct: string;
  };
  trend: OverviewTrendPoint[];
  outstanding: {
    accountsReceivable: OverviewOutstandingLine;
    accountsPayable: OverviewOutstandingLine;
  };
  recentTransactions: OverviewRecentTransaction[];
}

/** Parse a numeric string/number into integer cents, guarding against float drift. */
const toCents = (value: string | number | null | undefined): number =>
  Math.round(Number(value ?? 0) * 100);

/** Integer cents → fixed(2) string. */
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

/** "YYYY-MM-DD" for a Date, using its local components. */
const toDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Parse a "YYYY-MM-DD" string into a local Date at midnight. */
const parseDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

/** Whole days between two "YYYY-MM-DD" bounds, inclusive. */
const inclusiveDayCount = (from: string, to: string): number => {
  const ms = parseDate(to).getTime() - parseDate(from).getTime();
  return Math.floor(ms / 86_400_000) + 1;
};

/**
 * Signed percentage change from `prev` to `curr`, as a fixed(2) string.
 * "0.00" when the previous value is 0 (no baseline to compare against).
 */
const pctChange = (currCents: number, prevCents: number): string => {
  if (prevCents === 0) return '0.00';
  return (((currCents - prevCents) / Math.abs(prevCents)) * 100).toFixed(2);
};

/** Max number of points the trend chart renders. Longer ranges are bucketed. */
const MAX_TREND_POINTS = 15;

/**
 * Cash / bank account heuristic (chart-of-accounts convention):
 * an ASSET account is treated as "cash" when its `code` starts with one of the
 * seeded liquid-asset prefixes '1010' (Cash in Hand) / '1020' (Bank Account) /
 * '1030' (Mobile Banking Wallet), OR its `name` matches /cash|bank|mobile banking/i.
 */
const isCashAccount = (code: string, name: string): boolean => {
  const c = code ?? '';
  const n = (name ?? '').toLowerCase();
  return (
    c.startsWith('1010') ||
    c.startsWith('1020') ||
    c.startsWith('1030') ||
    /cash|bank|mobile banking/i.test(n)
  );
};

/**
 * Accounts-receivable heuristic: an ASSET account whose `code` starts with '1100'
 * (seeded Accounts Receivable) OR whose `name` matches /receivable/i.
 */
const isReceivableAccount = (code: string, name: string): boolean =>
  (code ?? '').startsWith('1100') || /receivable/i.test(name ?? '');

/**
 * Accounts-payable heuristic: a LIABILITY account whose `code` starts with '2010'
 * (seeded Accounts Payable) OR whose `name` matches /payable/i — but excluding any
 * tax/VAT payable account (code '2050' or name matching /tax|vat/i), which is a
 * statutory remittance, not a trade payable.
 */
const isPayableAccount = (code: string, name: string): boolean => {
  const c = code ?? '';
  const n = name ?? '';
  if (c.startsWith('2050') || /tax|vat/i.test(n)) return false;
  return c.startsWith('2010') || /payable/i.test(n);
};

/**
 * Builds the Accounting Overview payload for the `/dashboard/accounting` landing page.
 *
 * Composes the existing report services (so the headline flow KPIs match the P&L page
 * exactly) with a few direct, POSTED-only aggregation queries for the trend chart,
 * cash balance and outstanding AR/AP. Every classification heuristic is documented on
 * the helper it lives in. Integer-cents math throughout — no float drift.
 */
@Injectable()
export class GetAccountingOverviewService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly journalLineRepository: Repository<JournalLineEntity>,
    private readonly getProfitLossReportService: GetProfitLossReportService,
    private readonly listJournalEntriesService: ListJournalEntriesService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    query: AccountingOverviewQueryDto,
  ): Promise<AccountingOverview> {
    const period = this.resolvePeriod(query);
    const previousPeriod = this.previousPeriod(period);

    // ── Flow KPIs — reuse the P&L service for the current and the previous period,
    //    keeping the arithmetic identical to the Profit & Loss page. ──
    const [currentPl, previousPl] = await Promise.all([
      this.getProfitLossReportService.execute(tenantId, storeId, period),
      this.getProfitLossReportService.execute(tenantId, storeId, previousPeriod),
    ]);

    const currentRevenueCents = toCents(currentPl.revenue.total);
    const currentExpensesCents =
      toCents(currentPl.cogs.total) + toCents(currentPl.operatingExpenses.total);
    const currentNetProfitCents = toCents(currentPl.netProfit);

    const prevRevenueCents = toCents(previousPl.revenue.total);
    const prevExpensesCents =
      toCents(previousPl.cogs.total) + toCents(previousPl.operatingExpenses.total);
    const prevNetProfitCents = toCents(previousPl.netProfit);

    const accounts = await this.accountRepository.find({ where: { storeId } });

    const [cashBalance, outstanding, trend, recentTransactions] = await Promise.all([
      this.computeCashBalance(storeId, accounts, period.to),
      this.computeOutstanding(storeId, accounts, period.to),
      this.computeTrend(storeId, period),
      this.computeRecentTransactions(storeId),
    ]);

    return {
      period,
      kpis: {
        totalRevenue: fromCents(currentRevenueCents),
        totalExpenses: fromCents(currentExpensesCents),
        netProfit: fromCents(currentNetProfitCents),
        cashBalance,
      },
      comparison: {
        previousPeriod,
        revenueChangePct: pctChange(currentRevenueCents, prevRevenueCents),
        expensesChangePct: pctChange(currentExpensesCents, prevExpensesCents),
        netProfitChangePct: pctChange(currentNetProfitCents, prevNetProfitCents),
      },
      trend,
      outstanding,
      recentTransactions,
    };
  }

  /**
   * Resolves the reporting window. An explicit `from`/`to` wins; any missing bound
   * defaults to the current calendar month — the 1st of this month through today.
   */
  private resolvePeriod(query: AccountingOverviewQueryDto): OverviewPeriod {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: query.from ?? toDateString(monthStart),
      to: query.to ?? toDateString(now),
    };
  }

  /**
   * The immediately-preceding period of equal length: it ends the day before `from`
   * and spans the same number of inclusive days.
   */
  private previousPeriod(period: OverviewPeriod): OverviewPeriod {
    const days = inclusiveDayCount(period.from, period.to);
    const prevTo = parseDate(period.from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - (days - 1));
    return { from: toDateString(prevFrom), to: toDateString(prevTo) };
  }

  /**
   * Cash balance = Σ over cash/bank ASSET accounts of
   * (openingBalance + net POSTED movement (debit − credit) with entry.date <= `to`).
   */
  private async computeCashBalance(
    storeId: string,
    accounts: AccountEntity[],
    to: string,
  ): Promise<string> {
    const cashAccounts = accounts.filter(
      (a) => a.type === AccountTypeEnum.ASSET && isCashAccount(a.code, a.name),
    );
    if (cashAccounts.length === 0) return '0.00';

    const movement = await this.movementByAccountThrough(
      storeId,
      cashAccounts.map((a) => a.id),
      to,
    );

    let cents = 0;
    for (const account of cashAccounts) {
      const m = movement.get(account.id) ?? { debit: 0, credit: 0 };
      cents += toCents(account.openingBalance) + m.debit - m.credit;
    }
    return fromCents(cents);
  }

  /**
   * Outstanding AR / AP as of `to`.
   * AR: positive closing balances (opening + debit − credit) over receivable ASSET accounts.
   * AP: positive closing balances (opening + credit − debit) over payable LIABILITY accounts.
   * `accountCount` = how many such accounts carry a non-zero closing balance.
   */
  private async computeOutstanding(
    storeId: string,
    accounts: AccountEntity[],
    to: string,
  ): Promise<AccountingOverview['outstanding']> {
    const arAccounts = accounts.filter(
      (a) => a.type === AccountTypeEnum.ASSET && isReceivableAccount(a.code, a.name),
    );
    const apAccounts = accounts.filter(
      (a) => a.type === AccountTypeEnum.LIABILITY && isPayableAccount(a.code, a.name),
    );

    const movement = await this.movementByAccountThrough(
      storeId,
      [...arAccounts, ...apAccounts].map((a) => a.id),
      to,
    );

    let arCents = 0;
    let arCount = 0;
    for (const account of arAccounts) {
      const m = movement.get(account.id) ?? { debit: 0, credit: 0 };
      const closing = toCents(account.openingBalance) + m.debit - m.credit;
      if (closing !== 0) arCount += 1;
      if (closing > 0) arCents += closing;
    }

    let apCents = 0;
    let apCount = 0;
    for (const account of apAccounts) {
      const m = movement.get(account.id) ?? { debit: 0, credit: 0 };
      const closing = toCents(account.openingBalance) + m.credit - m.debit;
      if (closing !== 0) apCount += 1;
      if (closing > 0) apCents += closing;
    }

    return {
      accountsReceivable: { amount: fromCents(arCents), accountCount: arCount },
      accountsPayable: { amount: fromCents(apCents), accountCount: apCount },
    };
  }

  /**
   * Net POSTED debit/credit movement per account with `entry.date <= through`.
   */
  private async movementByAccountThrough(
    storeId: string,
    accountIds: string[],
    through: string,
  ): Promise<Map<string, { debit: number; credit: number }>> {
    if (accountIds.length === 0) return new Map();

    const rows = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin(JournalEntryEntity, 'entry', 'entry.id = line.journalEntryId')
      .select('line.accountId', 'accountId')
      .addSelect('COALESCE(SUM(line.debit), 0)', 'debit')
      .addSelect('COALESCE(SUM(line.credit), 0)', 'credit')
      .where('line.storeId = :storeId', { storeId })
      .andWhere('line.accountId IN (:...accountIds)', { accountIds })
      .andWhere('entry.status = :status', { status: JournalStatusEnum.POSTED })
      .andWhere('entry.date <= :through', { through })
      .groupBy('line.accountId')
      .getRawMany<{ accountId: string; debit: string; credit: string }>();

    return new Map(
      rows.map((r) => [r.accountId, { debit: toCents(r.debit), credit: toCents(r.credit) }]),
    );
  }

  /**
   * Daily revenue/expense movement across [from, to], POSTED only.
   * revenue = Σ REVENUE (credit − debit) that day; expenses = Σ EXPENSE (debit − credit) that day.
   * One point per day when the range is ≤ MAX_TREND_POINTS days; otherwise the days are
   * folded into ~equal contiguous buckets so at most MAX_TREND_POINTS points are returned.
   * Gap days contribute 0.
   */
  private async computeTrend(
    storeId: string,
    period: OverviewPeriod,
  ): Promise<OverviewTrendPoint[]> {
    const rows = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin(JournalEntryEntity, 'entry', 'entry.id = line.journalEntryId')
      .innerJoin(AccountEntity, 'account', 'account.id = line.accountId')
      .select('entry.date', 'date')
      .addSelect('account.type', 'type')
      .addSelect('COALESCE(SUM(line.debit), 0)', 'debit')
      .addSelect('COALESCE(SUM(line.credit), 0)', 'credit')
      .where('line.storeId = :storeId', { storeId })
      .andWhere('entry.status = :status', { status: JournalStatusEnum.POSTED })
      .andWhere('entry.date >= :from', { from: period.from })
      .andWhere('entry.date <= :to', { to: period.to })
      .andWhere('account.type IN (:...types)', {
        types: [AccountTypeEnum.REVENUE, AccountTypeEnum.EXPENSE],
      })
      .groupBy('entry.date')
      .addGroupBy('account.type')
      .getRawMany<{ date: string | Date; type: AccountTypeEnum; debit: string; credit: string }>();

    // Per-day tallies keyed by "YYYY-MM-DD".
    const perDay = new Map<string, { revenue: number; expenses: number }>();
    for (const r of rows) {
      const key = r.date instanceof Date ? toDateString(r.date) : String(r.date).slice(0, 10);
      const bucket = perDay.get(key) ?? { revenue: 0, expenses: 0 };
      if (r.type === AccountTypeEnum.REVENUE) {
        bucket.revenue += toCents(r.credit) - toCents(r.debit);
      } else {
        bucket.expenses += toCents(r.debit) - toCents(r.credit);
      }
      perDay.set(key, bucket);
    }

    // Dense list of every day in the window.
    const totalDays = Math.max(1, inclusiveDayCount(period.from, period.to));
    const days: Array<{ date: string; revenue: number; expenses: number }> = [];
    const cursor = parseDate(period.from);
    for (let i = 0; i < totalDays; i += 1) {
      const key = toDateString(cursor);
      const bucket = perDay.get(key) ?? { revenue: 0, expenses: 0 };
      days.push({ date: key, revenue: bucket.revenue, expenses: bucket.expenses });
      cursor.setDate(cursor.getDate() + 1);
    }

    if (days.length <= MAX_TREND_POINTS) {
      return days.map((d) => ({
        date: d.date,
        revenue: fromCents(d.revenue),
        expenses: fromCents(d.expenses),
      }));
    }

    // Fold into ~equal contiguous buckets, labelling each by its first day.
    const bucketCount = MAX_TREND_POINTS;
    const points: OverviewTrendPoint[] = [];
    for (let b = 0; b < bucketCount; b += 1) {
      const start = Math.floor((b * days.length) / bucketCount);
      const end = Math.floor(((b + 1) * days.length) / bucketCount);
      let revenue = 0;
      let expenses = 0;
      for (let i = start; i < end; i += 1) {
        revenue += days[i].revenue;
        expenses += days[i].expenses;
      }
      points.push({
        date: days[start].date,
        revenue: fromCents(revenue),
        expenses: fromCents(expenses),
      });
    }
    return points;
  }

  /**
   * Latest 8 POSTED journal entries, mapped for the Recent Transactions table.
   *
   * Income/Expense rule: look up the AccountTypeEnum of every account referenced by
   * these entries in a single query, then — if any line hits a REVENUE account the
   * entry is `Income`; else if any line hits an EXPENSE account it is `Expense`; else
   * it is classified by the type of its single largest line (debit+credit), REVENUE →
   * Income, anything else → Expense.
   */
  private async computeRecentTransactions(
    storeId: string,
  ): Promise<OverviewRecentTransaction[]> {
    const { items } = await this.listJournalEntriesService.execute(storeId, {
      status: JournalStatusEnum.POSTED,
      page: 1,
      limit: 8,
    });

    const accountIds = Array.from(
      new Set(items.flatMap((e) => (e.lines ?? []).map((l) => l.accountId))),
    );
    const typeByAccountId = new Map<string, AccountTypeEnum>();
    if (accountIds.length > 0) {
      const accs = await this.accountRepository.find({
        where: { storeId },
        select: ['id', 'type'],
      });
      for (const a of accs) {
        if (accountIds.includes(a.id)) typeByAccountId.set(a.id, a.type);
      }
    }

    return items.map((entry) => {
      const lines = [...(entry.lines ?? [])].sort((a, b) => a.lineOrder - b.lineOrder);
      const types = lines.map((l) => typeByAccountId.get(l.accountId));

      let type: 'Income' | 'Expense';
      if (types.includes(AccountTypeEnum.REVENUE)) {
        type = 'Income';
      } else if (types.includes(AccountTypeEnum.EXPENSE)) {
        type = 'Expense';
      } else {
        const largest = lines.reduce<{ type?: AccountTypeEnum; magnitude: number }>(
          (acc, l) => {
            const magnitude = toCents(l.debit) + toCents(l.credit);
            return magnitude > acc.magnitude
              ? { type: typeByAccountId.get(l.accountId), magnitude }
              : acc;
          },
          { magnitude: -1 },
        );
        type = largest.type === AccountTypeEnum.REVENUE ? 'Income' : 'Expense';
      }

      const first = lines[0];
      const accountLabel = first
        ? lines.length > 1
          ? `${first.accountName} +${lines.length - 1}`
          : first.accountName
        : '';

      return {
        id: entry.id,
        date: entry.date,
        description: entry.description,
        account: accountLabel,
        type,
        amount: fromCents(toCents(entry.totalDebit)),
        status: entry.status,
      };
    });
  }
}
