import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity, AccountTypeEnum } from '../entities/account.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { JournalEntryEntity, JournalStatusEnum } from '../entities/journal-entry.entity';
import { BalanceSheetQueryDto } from '../dto/report.dto';

interface ReportLine {
  accountId: string;
  code: string;
  name: string;
  amount: string;
}

export interface BalanceSheetReport {
  asOf: string;
  assets: { total: string; lines: ReportLine[] };
  liabilities: { total: string; lines: ReportLine[] };
  equity: { total: string; lines: ReportLine[]; retainedEarningsToDate: string };
  liabilitiesAndEquity: string;
  isBalanced: boolean;
  difference: string;
}

/** Parse a numeric string/number into integer cents, guarding against float drift. */
const toCents = (value: string | number | null | undefined): number =>
  Math.round(Number(value ?? 0) * 100);

/** Integer cents → fixed(2) string. */
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

/** "YYYY-MM-DD" for a Date, using its local components. */
const toDateString = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Balance tolerance in cents (0.01). */
const BALANCE_TOLERANCE_CENTS = 1;

/**
 * Builds the Balance Sheet at a single point in time (`asOf`, default today).
 *
 * Point-in-time statement: cumulative from inception through `asOf`. Each account's
 * balance is its `openingBalance` plus the net movement of every POSTED journal line
 * with `entry.date <= asOf`. DRAFT and VOID entries are excluded everywhere.
 *
 * Asset per account       = openingBalance + Σ(debit − credit) through asOf.
 * Liability per account    = openingBalance + Σ(credit − debit) through asOf.
 * Equity per account (booked) = openingBalance + Σ(credit − debit) through asOf.
 *
 * Retained earnings to date = current-period net income folded into equity so the sheet
 * balances: (Σ REVENUE credit−debit through asOf) − (Σ EXPENSE debit−credit through asOf).
 * `equity.total` INCLUDES this figure. `isBalanced` is true when
 * |assets.total − (liabilities.total + equity.total)| ≤ 0.01.
 */
@Injectable()
export class GetBalanceSheetReportService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly journalLineRepository: Repository<JournalLineEntity>,
  ) {}

  async execute(
    _tenantId: string,
    storeId: string,
    query: BalanceSheetQueryDto,
  ): Promise<BalanceSheetReport> {
    const asOf = query.asOf ?? toDateString(new Date());

    const accounts = await this.accountRepository.find({
      where: { storeId },
      order: { code: 'ASC' },
    });

    const movementRows = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin(JournalEntryEntity, 'entry', 'entry.id = line.journalEntryId')
      .select('line.accountId', 'accountId')
      .addSelect('COALESCE(SUM(line.debit), 0)', 'debit')
      .addSelect('COALESCE(SUM(line.credit), 0)', 'credit')
      .where('line.storeId = :storeId', { storeId })
      .andWhere('entry.status = :status', { status: JournalStatusEnum.POSTED })
      .andWhere('entry.date <= :asOf', { asOf })
      .groupBy('line.accountId')
      .getRawMany<{ accountId: string; debit: string; credit: string }>();

    const movementByAccount = new Map(
      movementRows.map((r) => [r.accountId, { debit: toCents(r.debit), credit: toCents(r.credit) }]),
    );

    const assetLines: ReportLine[] = [];
    const liabilityLines: ReportLine[] = [];
    const equityLines: ReportLine[] = [];
    let assetCents = 0;
    let liabilityCents = 0;
    let equityBookedCents = 0;
    let revenueCents = 0;
    let expenseCents = 0;

    for (const account of accounts) {
      const movement = movementByAccount.get(account.id) ?? { debit: 0, credit: 0 };
      const openingCents = toCents(account.openingBalance);

      switch (account.type) {
        case AccountTypeEnum.ASSET: {
          const amount = openingCents + movement.debit - movement.credit;
          assetCents += amount;
          if (amount !== 0) {
            assetLines.push(this.line(account, amount));
          }
          break;
        }
        case AccountTypeEnum.LIABILITY: {
          const amount = openingCents + movement.credit - movement.debit;
          liabilityCents += amount;
          if (amount !== 0) {
            liabilityLines.push(this.line(account, amount));
          }
          break;
        }
        case AccountTypeEnum.EQUITY: {
          const amount = openingCents + movement.credit - movement.debit;
          equityBookedCents += amount;
          if (amount !== 0) {
            equityLines.push(this.line(account, amount));
          }
          break;
        }
        case AccountTypeEnum.REVENUE:
          revenueCents += movement.credit - movement.debit;
          break;
        case AccountTypeEnum.EXPENSE:
          expenseCents += movement.debit - movement.credit;
          break;
      }
    }

    const retainedEarningsToDateCents = revenueCents - expenseCents;
    const equityTotalCents = equityBookedCents + retainedEarningsToDateCents;
    const liabilitiesAndEquityCents = liabilityCents + equityTotalCents;
    const differenceCents = assetCents - liabilitiesAndEquityCents;

    return {
      asOf,
      assets: { total: fromCents(assetCents), lines: assetLines },
      liabilities: { total: fromCents(liabilityCents), lines: liabilityLines },
      equity: {
        total: fromCents(equityTotalCents),
        lines: equityLines,
        retainedEarningsToDate: fromCents(retainedEarningsToDateCents),
      },
      liabilitiesAndEquity: fromCents(liabilitiesAndEquityCents),
      isBalanced: Math.abs(differenceCents) <= BALANCE_TOLERANCE_CENTS,
      difference: fromCents(differenceCents),
    };
  }

  private line(account: AccountEntity, amountCents: number): ReportLine {
    return {
      accountId: account.id,
      code: account.code,
      name: account.name,
      amount: fromCents(amountCents),
    };
  }
}
