import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { JournalEntryEntity } from '../entities/journal-entry.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { ListJournalEntriesQueryDto } from '../dto/journal-entry.dto';

export interface PaginatedJournalEntries {
  items: JournalEntryEntity[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Paginated, filterable list of journal entries for the Transactions → Journal Entries page.
 * Search matches entry number, description or reference. An accountId filter keeps only
 * entries that touch that account.
 */
@Injectable()
export class ListJournalEntriesService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepository: Repository<JournalEntryEntity>,
  ) {}

  async execute(
    storeId: string,
    query: ListJournalEntriesQueryDto,
  ): Promise<PaginatedJournalEntries> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const qb = this.journalRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.lines', 'line')
      .where('entry.storeId = :storeId', { storeId });

    if (query.status) {
      qb.andWhere('entry.status = :status', { status: query.status });
    }
    if (query.from) {
      qb.andWhere('entry.date >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('entry.date <= :to', { to: query.to });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('entry.entryNumber ILIKE :s', { s: `%${query.search}%` })
            .orWhere('entry.description ILIKE :s', { s: `%${query.search}%` })
            .orWhere('entry.reference ILIKE :s', { s: `%${query.search}%` });
        }),
      );
    }
    if (query.accountId) {
      qb.andWhere(
        (sub) =>
          `entry.id IN ${sub
            .subQuery()
            .select('l.journalEntryId')
            .from(JournalLineEntity, 'l')
            .where('l.accountId = :accountId')
            .getQuery()}`,
      ).setParameter('accountId', query.accountId);
    }

    qb.orderBy('entry.date', 'DESC')
      .addOrderBy('entry.entryNumber', 'DESC')
      .addOrderBy('line.lineOrder', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
