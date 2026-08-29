import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountEntity,
  AccountTypeEnum,
  NormalBalanceEnum,
} from '../entities/account.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { JournalEntryEntity, JournalStatusEnum } from '../entities/journal-entry.entity';

export interface AccountWithBalances extends AccountEntity {
  totalDebit: string;
  totalCredit: string;
  closingBalance: string;
}

export interface AccountTreeGroup {
  type: AccountTypeEnum;
  label: string;
  accounts: AccountWithBalances[];
}

const GROUP_ORDER: Array<{ type: AccountTypeEnum; label: string }> = [
  { type: AccountTypeEnum.ASSET, label: 'Assets' },
  { type: AccountTypeEnum.LIABILITY, label: 'Liabilities' },
  { type: AccountTypeEnum.EQUITY, label: 'Equity' },
  { type: AccountTypeEnum.REVENUE, label: 'Income' },
  { type: AccountTypeEnum.EXPENSE, label: 'Expenses' },
];

/**
 * Builds the grouped view the Chart of Accounts page renders: the five root classes, each
 * with its accounts (code-ordered) and the running debit/credit totals plus closing
 * balance computed from POSTED journal lines only.
 */
@Injectable()
export class GetAccountTreeService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    @InjectRepository(JournalLineEntity)
    private readonly journalLineRepository: Repository<JournalLineEntity>,
  ) {}

  async execute(storeId: string): Promise<AccountTreeGroup[]> {
    const accounts = await this.accountRepository.find({
      where: { storeId },
      order: { code: 'ASC' },
    });

    const totalsRows = await this.journalLineRepository
      .createQueryBuilder('line')
      .innerJoin(JournalEntryEntity, 'entry', 'entry.id = line.journalEntryId')
      .select('line.accountId', 'accountId')
      .addSelect('COALESCE(SUM(line.debit), 0)', 'totalDebit')
      .addSelect('COALESCE(SUM(line.credit), 0)', 'totalCredit')
      .where('line.storeId = :storeId', { storeId })
      .andWhere('entry.status = :status', { status: JournalStatusEnum.POSTED })
      .groupBy('line.accountId')
      .getRawMany<{ accountId: string; totalDebit: string; totalCredit: string }>();

    const totalsByAccount = new Map(
      totalsRows.map((r) => [
        r.accountId,
        { debit: Number(r.totalDebit), credit: Number(r.totalCredit) },
      ]),
    );

    const groups: AccountTreeGroup[] = GROUP_ORDER.map(({ type, label }) => ({
      type,
      label,
      accounts: [],
    }));
    const groupByType = new Map(groups.map((g) => [g.type, g]));

    for (const account of accounts) {
      const totals = totalsByAccount.get(account.id) ?? { debit: 0, credit: 0 };
      const opening = Number(account.openingBalance);
      const closing =
        account.normalBalance === NormalBalanceEnum.DEBIT
          ? opening + totals.debit - totals.credit
          : opening + totals.credit - totals.debit;

      const group = groupByType.get(account.type);
      if (!group) continue;

      group.accounts.push(
        Object.assign(account, {
          totalDebit: totals.debit.toFixed(2),
          totalCredit: totals.credit.toFixed(2),
          closingBalance: closing.toFixed(2),
        }),
      );
    }

    return groups;
  }
}
