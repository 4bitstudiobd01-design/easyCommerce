import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * A single progressive income-tax bracket for one store's fiscal year, e.g.
 * "0 - 350,000 @ 0%" or "450,001 and above @ 10%" (maxAmount null = open-ended top slab).
 *
 * Deliberately NOT pre-populated with real Bangladesh NBR figures anywhere in this
 * codebase — tax slabs and rates change with each Finance Act and must be entered (and
 * kept current) by the merchant's own accountant. This module is the calculator
 * mechanism only; it is not a source of tax rates or tax advice.
 */
@Entity('hr_tax_slabs')
@Index('IDX_hr_tax_slabs_storeId_fiscalYear', ['storeId', 'fiscalYear'])
export class TaxSlabEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  /** Bangladesh's tax year runs July–June, e.g. "2025-2026". Plain text, not parsed. */
  @Column({ type: 'varchar', length: 20 })
  fiscalYear: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  minAmount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  maxAmount?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  ratePercent: string;

  @Column({ type: 'int' })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
