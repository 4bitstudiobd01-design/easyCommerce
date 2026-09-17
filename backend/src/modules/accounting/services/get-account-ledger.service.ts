import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountEntity,
  AccountTypeEnum,
  NormalBalanceEnum,
} from '../entities/account.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { JournalEntryEntity, JournalStatusEnum } from '../entities/journal-entry.entity';
import { LedgerQueryDto } from '../dto/ledger.dto';

export interface LedgerRow {
  date: string;
  entryId: string;
  entryNumber: string;
  description: string;
  memo: string | null;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface AccountLedger {
  account: {
    id: string;
    code: string;
    name: string;
    type: AccountTypeEnum;
    normalBalance: NormalBalanceEnum;
  };
  from: string | null;
  to: string | null;
  openingBalance: string;
  closingBalance: string;
  totalDebit: string;
  totalCredit: string;
  rows: LedgerRow[];
}

/** Parse a numeric string/number into integer cents, guarding against float drift. */
const toCents = (value: string | number | null | undefined): number =>
  Math.round(Number(value ?? 0) * 100);

/** Integer cents → fixed(2) string. */
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

/**
 * Builds the General Ledger for a single account over an optional inclusive date window:
 * the opening balance carried in, every POSTED journal line in range with its running
 * balance, and the closing balance / in-range debit & credit totals.
 *
 * Only POSTED entries are counted — DRAFT and VOID are excluded everywhere, matching the
 * Chart of Accounts tree and the reports slices.
 */
@Injectable()
export class GetAccountLedgerService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly journalLineRepository: Repository<JournalLineEntity>,
  ) {}

  async execute(storeId: string, query: LedgerQueryDto): Promise<AccountLedger> {
    const account = await this.accountRepository.findOne({
      where: { id: query.accountId, storeId },
    });
    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    const isDebitNormal = account.normalBalance === NormalBalanceEnum.DEBIT;
    const from = query.from ?? null;
    const to = query.to ?? null;

    // Opening balance = account opening + net movement of POSTED lines strictly before `from`.
    let openingCents = toCents(account.openingBalance);
    if (from) {
      const beforeRow = await this.journalLineRepository
        .createQueryBuilder('line')
        .innerJoin(JournalEntryEntity, 'entry', 'entry.id = line.journalEntryId')
        .select('COALESCE(SUM(line.debit), 0)', 'debit')
        .addSelect('COALESCE(SUM(line.credit), 0)', 'credit')
        .where('line.storeId = :storeId', { storeId })
        .andWhere('line.accountId = :accountId', { accountId: account.id })
        .andWhere('entry.status = :status', { status: JournalStatusEnum.POSTED })
        .andWhere('entry.date < :from', { from })
        .getRawOne<{ debit: string; credit: string }>();

      const beforeDebit = toCents(beforeRow?.debit);
      const beforeCredit = toCents(beforeRow?.credit);
      openingCents += isDebitNormal
        ? beforeDebit - beforeCredit
        : beforeCredit - beforeDebit;
    }

    // In-range POSTED lines for this account, ordered for a stable running balance.
    const linesQuery = this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin(JournalEntryEntity, 'entry', 'entry.id = line.journalEntryId')
      .select([
        'line.debit AS "debit"',
        'line.credit AS "credit"',
        'line.memo AS "memo"',
        'entry.id AS "entryId"',
        'entry.entryNumber AS "entryNumber"',
        'entry.description AS "description"',
        'entry.date AS "date"',
      ])
      .where('line.storeId = :storeId', { storeId })
      .andWhere('line.accountId = :accountId', { accountId: account.id })
      .andWhere('entry.status = :status', { status: JournalStatusEnum.POSTED });

    if (from) {
      linesQuery.andWhere('entry.date >= :from', { from });
    }
    if (to) {
      linesQuery.andWhere('entry.date <= :to', { to });
    }

    linesQuery
      .orderBy('entry.date', 'ASC')
      .addOrderBy('entry.entryNumber', 'ASC')
      .addOrderBy('line.lineOrder', 'ASC');

    const rawLines = await linesQuery.getRawMany<{
      debit: string;
      credit: string;
      memo: string | null;
      entryId: string;
      entryNumber: string;
      description: string;
      date: string | Date;
    }>();

    let runningCents = openingCents;
    let totalDebitCents = 0;
    let totalCreditCents = 0;

    const rows: LedgerRow[] = rawLines.map((line) => {
      const debitCents = toCents(line.debit);
      const creditCents = toCents(line.credit);
      totalDebitCents += debitCents;
      totalCreditCents += creditCents;
      runningCents += isDebitNormal
        ? debitCents - creditCents
        : creditCents - debitCents;

      return {
        date: line.date instanceof Date ? line.date.toISOString().slice(0, 10) : line.date,
        entryId: line.entryId,
        entryNumber: line.entryNumber,
        description: line.description,
        memo: line.memo ?? null,
        debit: fromCents(debitCents),
        credit: fromCents(creditCents),
        runningBalance: fromCents(runningCents),
      };
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
      },
      from,
      to,
      openingBalance: fromCents(openingCents),
      closingBalance: rows.length ? rows[rows.length - 1].runningBalance : fromCents(openingCents),
      totalDebit: fromCents(totalDebitCents),
      totalCredit: fromCents(totalCreditCents),
      rows,
    };
  }
}
