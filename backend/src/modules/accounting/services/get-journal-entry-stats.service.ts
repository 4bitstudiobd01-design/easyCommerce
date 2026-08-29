import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JournalEntryEntity,
  JournalStatusEnum,
} from '../entities/journal-entry.entity';

export interface JournalEntryStats {
  totalEntries: number;
  postedEntries: number;
  draftEntries: number;
  /** Sum of totalDebit across POSTED entries this calendar month, as a fixed(2) string. */
  totalAmount: string;
}

function monthBounds(now: Date): { from: string; to: string } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

/**
 * KPI figures for the Journal Entries page, scoped to the current calendar month by the
 * entry's accounting `date`.
 */
@Injectable()
export class GetJournalEntryStatsService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepository: Repository<JournalEntryEntity>,
  ) {}

  async execute(storeId: string): Promise<JournalEntryStats> {
    const { from, to } = monthBounds(new Date());

    const rows = await this.journalRepository
      .createQueryBuilder('entry')
      .select('entry.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(entry.totalDebit), 0)', 'totalDebit')
      .where('entry.storeId = :storeId', { storeId })
      .andWhere('entry.date >= :from', { from })
      .andWhere('entry.date <= :to', { to })
      .groupBy('entry.status')
      .getRawMany<{ status: JournalStatusEnum; count: string; totalDebit: string }>();

    let totalEntries = 0;
    let postedEntries = 0;
    let draftEntries = 0;
    let postedAmount = 0;

    for (const row of rows) {
      const count = Number(row.count);
      totalEntries += count;
      if (row.status === JournalStatusEnum.POSTED) {
        postedEntries = count;
        postedAmount = Number(row.totalDebit);
      } else if (row.status === JournalStatusEnum.DRAFT) {
        draftEntries = count;
      }
    }

    return {
      totalEntries,
      postedEntries,
      draftEntries,
      totalAmount: postedAmount.toFixed(2),
    };
  }
}
