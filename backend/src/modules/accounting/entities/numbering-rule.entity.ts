import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * The document families that carry an auto-incrementing per-store number.
 */
export enum NumberingDocTypeEnum {
  JOURNAL_ENTRY = 'JOURNAL_ENTRY',
  EXPENSE = 'EXPENSE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  CREDIT_NOTE = 'CREDIT_NOTE',
}

/**
 * Prefix / suffix / next-sequence for one document family. AllocateNextNumberService
 * bumps nextSequence atomically and formats "{prefix}{YYYY}-{seq padded}{suffix}".
 */
@Entity('acc_numbering_rules')
@Index('IDX_acc_numbering_rules_storeId_docType', ['storeId', 'docType'], { unique: true })
export class NumberingRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_numbering_rules_storeId')
  storeId: string;

  @Column({ type: 'enum', enum: NumberingDocTypeEnum })
  docType: NumberingDocTypeEnum;

  @Column({ type: 'varchar', length: 12, default: '' })
  prefix: string;

  @Column({ type: 'varchar', length: 12, default: '' })
  suffix: string;

  /** Whether to embed the fiscal/calendar year segment between prefix and sequence. */
  @Column({ type: 'boolean', default: true })
  includeYear: boolean;

  /** Zero-pad width for the numeric part. */
  @Column({ type: 'int', default: 4 })
  padWidth: number;

  /** Next value to hand out. Incremented on every allocation. */
  @Column({ type: 'int', default: 1 })
  nextSequence: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
