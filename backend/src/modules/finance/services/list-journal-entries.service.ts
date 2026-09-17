import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceJournalEntryEntity } from '../entities/finance-journal-entry.entity';
import { QueryJournalEntriesDto } from '../dto/journal-entry.dto';

@Injectable()
export class ListJournalEntriesService {
  constructor(
    @InjectRepository(FinanceJournalEntryEntity)
    private readonly journalEntryRepository: Repository<FinanceJournalEntryEntity>,
  ) {}

  async execute(storeId: string, query: QueryJournalEntriesDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.journalEntryRepository
      .createQueryBuilder('je')
      .leftJoinAndSelect('je.lines', 'lines')
      .where('je.storeId = :storeId', { storeId });

    if (query.sourceType) {
      qb.andWhere('je.sourceType = :sourceType', { sourceType: query.sourceType });
    }

    if (query.status) {
      qb.andWhere('je.status = :status', { status: query.status });
    }

    if (query.startDate) {
      qb.andWhere('je.entryDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('je.entryDate <= :endDate', { endDate: query.endDate });
    }

    if (query.accountId) {
      qb.andWhere('lines.accountId = :accountId', { accountId: query.accountId });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(je.description) LIKE LOWER(:search) OR je.entryNumber LIKE :searchRaw OR je.sourceReference LIKE :searchRaw OR LOWER(lines.accountName) LIKE LOWER(:search))',
        { search: `%${query.search}%`, searchRaw: `%${query.search}%` },
      );
    }

    qb.orderBy('je.entryDate', 'DESC')
      .addOrderBy('je.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    // Calculate aggregated totals for the store in the selected query
    const totalVolume = items.reduce((sum, item) => sum + Number(item.totalDebit || 0), 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalVolume,
        entryCount: total,
      },
    };
  }
}
