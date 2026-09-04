import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { JournalEntryEntity } from './journal-entry.entity';

/**
 * One debit-or-credit posting against a single account. A line carries an amount in
 * exactly one of debit/credit; the other is 0. The sum of debits equals the sum of
 * credits across all lines of a journal entry — enforced by PostJournalEntryService.
 */
@Entity('acc_journal_lines')
export class JournalLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  /** Branch this line is attributed to, mirrored from the parent JournalEntryEntity at
   *  post time. Null for store-wide/online entries. Weak reference — no FK/relation. */
  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_acc_journal_lines_branchId')
  branchId?: string;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_journal_lines_journalEntryId')
  journalEntryId: string;

  @ManyToOne(() => JournalEntryEntity, (entry) => entry.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry: JournalEntryEntity;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_journal_lines_accountId')
  accountId: string;

  /** Denormalised account number/name captured at post time, so a later COA rename
   *  does not rewrite historical vouchers. */
  @Column({ type: 'varchar', length: 20 })
  accountCode: string;

  @Column({ type: 'varchar', length: 150 })
  accountName: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  debit: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  credit: string;

  /** Optional per-line narration. */
  @Column({ type: 'varchar', length: 300, nullable: true })
  memo?: string;

  /** Position of this line within the entry, for stable display order. */
  @Column({ type: 'int', default: 0 })
  lineOrder: number;
}
