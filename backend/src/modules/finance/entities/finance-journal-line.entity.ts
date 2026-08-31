import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  FinanceLineTypeEnum,
  FinancePartyTypeEnum,
} from '../enums/finance.enums';
import { FinanceJournalEntryEntity } from './finance-journal-entry.entity';
import { FinanceChartOfAccountEntity } from './finance-chart-of-account.entity';

@Entity('fin_journal_lines')
@Index('IDX_fin_jl_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_jl_entry', ['journalEntryId'])
@Index('IDX_fin_jl_account', ['accountId'])
export class FinanceJournalLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  journalEntryId: string;

  @ManyToOne(() => FinanceJournalEntryEntity, (entry) => entry.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry: FinanceJournalEntryEntity;

  @Column({ type: 'uuid' })
  accountId: string;

  @ManyToOne(() => FinanceChartOfAccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: FinanceChartOfAccountEntity;

  @Column({ type: 'varchar', length: 20 })
  accountCode: string;

  @Column({ type: 'varchar', length: 150 })
  accountName: string;

  @Column({
    type: 'enum',
    enum: FinanceLineTypeEnum,
  })
  type: FinanceLineTypeEnum;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: FinancePartyTypeEnum,
    default: FinancePartyTypeEnum.NONE,
  })
  partyType: FinancePartyTypeEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  partyId?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  partyName?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
