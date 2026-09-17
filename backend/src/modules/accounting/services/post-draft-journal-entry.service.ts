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

const CENTS = 100;

function toCents(value: string): number {
  return Math.round(Number(value) * CENTS);
}

/**
 * Transitions a DRAFT journal entry to POSTED, stamping postedAt. The balancing rule is
 * re-checked from the persisted lines before the entry is allowed into the ledger.
 */
@Injectable()
export class PostDraftJournalEntryService {
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

    if (entry.status !== JournalStatusEnum.DRAFT) {
      throw new BadRequestException('Only draft entries can be posted.');
    }

    const lines = entry.lines ?? [];
    if (lines.length < 2) {
      throw new BadRequestException('A journal entry needs at least two lines.');
    }

    const totalDebit = lines.reduce((sum, l) => sum + toCents(l.debit), 0);
    const totalCredit = lines.reduce((sum, l) => sum + toCents(l.credit), 0);
    if (totalDebit !== totalCredit) {
      throw new BadRequestException(
        `Entry is not balanced: debits ${(totalDebit / CENTS).toFixed(2)} vs credits ${(totalCredit / CENTS).toFixed(2)}.`,
      );
    }

    entry.status = JournalStatusEnum.POSTED;
    entry.postedAt = new Date();
    entry.createdByUserId = entry.createdByUserId ?? userId;
    await this.journalRepository.save(entry);

    return this.journalRepository.findOne({
      where: { id: entry.id },
      relations: ['lines'],
    }) as Promise<JournalEntryEntity>;
  }
}
