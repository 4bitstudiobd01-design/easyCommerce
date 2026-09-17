import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * One row per store. Holds the store-wide financial configuration shown on
 * Accounting → Settings → General. Created lazily by GetAccountingSettingsService.
 */
@Entity('acc_settings')
export class AccountingSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_settings_storeId', { unique: true })
  storeId: string;

  /** Month (1-12) the fiscal year starts on. Bangladesh default: July = 7. */
  @Column({ type: 'int', default: 7 })
  fiscalYearStartMonth: number;

  /** ISO 4217. Functional currency is fixed per store once transactions exist. */
  @Column({ type: 'varchar', length: 3, default: 'BDT' })
  baseCurrency: string;

  /**
   * When true, other slices are allowed to auto-post journal entries (order settlement,
   * courier cost, gateway fees). When false only manual entries and expenses post.
   */
  @Column({ type: 'boolean', default: true })
  autoPostEnabled: boolean;

  /** Whether draft journal entries are allowed, or every entry must post immediately. */
  @Column({ type: 'boolean', default: true })
  allowDraftEntries: boolean;

  /** True once SeedDefaultChartOfAccountsService has run for this store. */
  @Column({ type: 'boolean', default: false })
  chartSeeded: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
