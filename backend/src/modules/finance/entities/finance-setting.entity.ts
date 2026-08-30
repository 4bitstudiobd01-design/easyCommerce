import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('fin_settings')
@Index('IDX_fin_settings_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_settings_storeId', ['storeId'], { unique: true })
export class FinanceSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_settings_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'varchar', length: 10, default: '৳' })
  currencySymbol: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  defaultTaxRate: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  taxNumber?: string;

  @Column({ type: 'varchar', length: 20, default: 'INV-' })
  invoicePrefix: string;

  @Column({ type: 'varchar', length: 20, default: 'BILL-' })
  billPrefix: string;

  @Column({ type: 'uuid', nullable: true })
  defaultSalesAccountId?: string;

  @Column({ type: 'uuid', nullable: true })
  defaultExpenseAccountId?: string;

  @Column({ type: 'text', nullable: true })
  invoiceFooterNote?: string;

  @Column({ type: 'text', nullable: true })
  invoiceTerms?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
