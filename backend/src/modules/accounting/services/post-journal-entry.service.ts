import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';
import {
  JournalEntryEntity,
  JournalSourceEnum,
  JournalStatusEnum,
} from '../entities/journal-entry.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { NumberingDocTypeEnum } from '../entities/numbering-rule.entity';
import { AllocateNextNumberService } from './allocate-next-number.service';

export interface JournalLineInput {
  accountId: string;
  debit?: number | string;
  credit?: number | string;
  memo?: string;
}

export interface PostJournalEntryInput {
  date: string;
  description: string;
  reference?: string;
  lines: JournalLineInput[];
  /** POSTED (default) or DRAFT. VOID is not a valid create status. */
  status?: JournalStatusEnum.POSTED | JournalStatusEnum.DRAFT;
  source?: JournalSourceEnum;
  sourceRef?: string;
  createdByUserId?: string;
}

const CENTS = 100;

function toCents(value: number | string | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n) || n < 0) {
    throw new BadRequestException('Debit and credit amounts must be non-negative numbers.');
  }
  return Math.round(n * CENTS);
}

function money(cents: number): string {
  return (cents / CENTS).toFixed(2);
}

/**
 * The single write path for the general ledger. Every posted (or drafted) journal entry —
 * manual, from an expense, or later from order/payment settlement — goes through here so
 * the balancing rule and numbering are enforced in exactly one place.
 *
 * Guarantees:
 *  - at least two lines, every line one-sided (debit xor credit), amount > 0
 *  - Σ debit === Σ credit (to the cent)
 *  - every accountId belongs to the same store and is active
 *  - entryNumber allocated once, atomically
 *  - idempotent for auto-posting: (storeId, source, sourceRef) returns the existing entry
 */
@Injectable()
export class PostJournalEntryService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepository: Repository<JournalEntryEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
    private readonly allocateNextNumberService: AllocateNextNumberService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    input: PostJournalEntryInput,
  ): Promise<JournalEntryEntity> {
    const source = input.source ?? JournalSourceEnum.MANUAL;
    const status = input.status ?? JournalStatusEnum.POSTED;

    if (source !== JournalSourceEnum.MANUAL && input.sourceRef) {
      const existing = await this.journalRepository.findOne({
        where: { storeId, source, sourceRef: input.sourceRef },
        relations: ['lines'],
      });
      if (existing) return existing;
    }

    if (!input.lines || input.lines.length < 2) {
      throw new BadRequestException('A journal entry needs at least two lines.');
    }

    const accountIds = [...new Set(input.lines.map((l) => l.accountId))];
    const accounts = await this.accountRepository.find({
      where: accountIds.map((id) => ({ id, storeId })),
    });
    if (accounts.length !== accountIds.length) {
      throw new NotFoundException('One or more accounts do not exist in this store.');
    }
    const accountById = new Map(accounts.map((a) => [a.id, a]));
    for (const account of accounts) {
      if (!account.isActive) {
        throw new BadRequestException(`Account ${account.code} — ${account.name} is inactive.`);
      }
    }

    let totalDebit = 0;
    let totalCredit = 0;
    const lineRows: Array<Partial<JournalLineEntity>> = input.lines.map((line, index) => {
      const debitCents = toCents(line.debit);
      const creditCents = toCents(line.credit);

      if (debitCents > 0 && creditCents > 0) {
        throw new BadRequestException(
          `Line ${index + 1} has both a debit and a credit. Each line must be one-sided.`,
        );
      }
      if (debitCents === 0 && creditCents === 0) {
        throw new BadRequestException(`Line ${index + 1} has no amount.`);
      }

      totalDebit += debitCents;
      totalCredit += creditCents;

      const account = accountById.get(line.accountId)!;
      return {
        storeId,
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        debit: money(debitCents),
        credit: money(creditCents),
        memo: line.memo,
        lineOrder: index,
      };
    });

    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Entry is not balanced: debits ${money(totalDebit)} vs credits ${money(totalCredit)}.`,
      );
    }

    const entryNumber = await this.allocateNextNumberService.execute(
      tenantId,
      storeId,
      NumberingDocTypeEnum.JOURNAL_ENTRY,
    );

    return this.dataSource.transaction(async (manager) => {
      const entryRepo = manager.getRepository(JournalEntryEntity);
      const lineRepo = manager.getRepository(JournalLineEntity);

      const entry = await entryRepo.save(
        entryRepo.create({
          tenantId,
          storeId,
          entryNumber,
          date: input.date,
          description: input.description,
          reference: input.reference,
          status,
          source,
          sourceRef: input.sourceRef,
          totalDebit: money(totalDebit),
          totalCredit: money(totalCredit),
          createdByUserId: input.createdByUserId,
          postedAt: status === JournalStatusEnum.POSTED ? new Date() : undefined,
        }),
      );

      await lineRepo.save(lineRows.map((row) => lineRepo.create({ ...row, journalEntryId: entry.id })));

      return entryRepo.findOne({ where: { id: entry.id }, relations: ['lines'] }) as Promise<JournalEntryEntity>;
    });
  }
}
