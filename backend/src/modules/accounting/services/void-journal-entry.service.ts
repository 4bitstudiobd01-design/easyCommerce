import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JournalEntryEntity,
  JournalStatusEnum,
} from '../entities/journal-entry.entity';

/**
 * Voids a journal entry. The row and its lines stay in the ledger for audit; the status
 * flips to VOID so the ledger, chart-of-accounts tree and reports (all of which filter on
 * status = POSTED) stop counting it. Only POSTED or DRAFT entries can be voided.
 */
@Injectable()
export class VoidJournalEntryService {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly journalRepository: Repository<JournalEntryEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
    userId: string,
  ): Promise<JournalEntryEntity> {
    const entry = await this.journalRepository.findOne({
      where: { id, storeId },
      relations: ['lines'],
    });
    if (!entry) {
      throw new NotFoundException('Journal entry not found.');
    }

    if (
      entry.status !== JournalStatusEnum.POSTED &&
      entry.status !== JournalStatusEnum.DRAFT
    ) {
      throw new BadRequestException(
        'Only posted or draft entries can be voided.',
      );
    }

    entry.status = JournalStatusEnum.VOID;
    entry.createdByUserId = entry.createdByUserId ?? userId;
    await this.journalRepository.save(entry);

    return this.journalRepository.findOne({
      where: { id: entry.id },
      relations: ['lines'],
    }) as Promise<JournalEntryEntity>;
  }
}
