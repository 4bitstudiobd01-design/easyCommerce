import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntryEntity } from '../entities/journal-entry.entity';

/**
 * Fetches a single journal entry with its lines ordered by lineOrder. Scoped to the store
 * so an id from another store resolves as not found.
 */
@Injectable()
export class GetJournalEntryService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepository: Repository<JournalEntryEntity>,
  ) {}

  async execute(storeId: string, id: string): Promise<JournalEntryEntity> {
    const entry = await this.journalRepository.findOne({
      where: { id, storeId },
      relations: ['lines'],
    });
    if (!entry) {
      throw new NotFoundException('Journal entry not found.');
    }
    entry.lines = (entry.lines ?? []).sort((a, b) => a.lineOrder - b.lineOrder);
    return entry;
  }
}
