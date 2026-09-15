import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import {
  FinanceJournalStatusEnum,
  FinanceJournalEntryTypeEnum,
} from '../enums/finance.enums';
import { FinanceJournalLineEntity } from './finance-journal-line.entity';

@Entity('fin_journal_entries')
@Index('IDX_fin_je_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_je_entryDate', ['storeId', 'entryDate'])
@Index('IDX_fin_je_number', ['storeId', 'entryNumber'], { unique: true })
export class FinanceJournalEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_je_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_je_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 50 })
  entryNumber: string;

  @Column({ type: 'date' })
  entryDate: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  postingDate: Date;

  @Column({
    type: 'enum',
    enum: FinanceJournalEntryTypeEnum,
    default: FinanceJournalEntryTypeEnum.MANUAL,
  })
  sourceType: FinanceJournalEntryTypeEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceReference?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalDebit: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalCredit: string;

  @Column({ type: 'boolean', default: true })
  isBalanced: boolean;

  @Column({
    type: 'enum',
    enum: FinanceJournalStatusEnum,
    default: FinanceJournalStatusEnum.POSTED,
  })
  status: FinanceJournalStatusEnum;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'uuid', nullable: true })
  postedByUserId?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  postedByName?: string;

  @Column({ type: 'jsonb', nullable: true })
  auditMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    history?: Array<{
      action: string;
      timestamp: string;
      userId?: string;
      details?: string;
    }>;
  };

  @OneToMany(() => FinanceJournalLineEntity, (line) => line.journalEntry, {
    cascade: true,
    eager: true,
  })
  lines: FinanceJournalLineEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
