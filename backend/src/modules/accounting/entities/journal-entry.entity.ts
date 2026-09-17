import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { JournalLineEntity } from './journal-line.entity';

export enum JournalStatusEnum {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOID = 'VOID',
}

/**
 * Where a journal entry originated. MANUAL entries are keyed by a merchant; the rest are
 * created by other slices (expenses today, order/payment settlement later) calling
 * PostJournalEntryService with the originating record id in sourceRef.
 */
export enum JournalSourceEnum {
  MANUAL = 'MANUAL',
  EXPENSE = 'EXPENSE',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  INVENTORY = 'INVENTORY',
  OPENING_BALANCE = 'OPENING_BALANCE',
  PURCHASE = 'PURCHASE',
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT',
}

@Entity('acc_journal_entries')
@Index('IDX_acc_journal_entries_storeId_entryNumber', ['storeId', 'entryNumber'], { unique: true })
export class JournalEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_journal_entries_storeId')
  storeId: string;

  /** Branch this entry is attributed to, when posted from a branch-scoped transaction
   *  (e.g. a branch-placed order). Null for store-wide/online entries. Weak reference —
   *  no FK/relation, matches OrderEntity.branchId. */
  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_acc_journal_entries_branchId')
  branchId?: string;

  /** Per-store voucher number, e.g. "JE-2026-0045". Assigned on first save from the numbering rule. */
  @Column({ type: 'varchar', length: 40 })
  entryNumber: string;

  /** Accounting date (not the row's createdAt). */
  @Column({ type: 'date' })
  @Index('IDX_acc_journal_entries_storeId_date')
  date: string;

  @Column({ type: 'varchar', length: 300 })
  description: string;

  /** Optional external reference typed by the user (order no, invoice no, …). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  reference?: string;

  @Column({ type: 'enum', enum: JournalStatusEnum, default: JournalStatusEnum.DRAFT })
  status: JournalStatusEnum;

  @Column({ type: 'enum', enum: JournalSourceEnum, default: JournalSourceEnum.MANUAL })
  source: JournalSourceEnum;

  /** Id of the originating record when source is not MANUAL. Used for idempotent auto-posting. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  @Index('IDX_acc_journal_entries_sourceRef')
  sourceRef?: string;

  /** Cached line totals, kept equal by PostJournalEntryService. Numeric strings. */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalDebit: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalCredit: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  postedAt?: Date;

  @OneToMany(() => JournalLineEntity, (line) => line.journalEntry, { cascade: true })
  lines: JournalLineEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
