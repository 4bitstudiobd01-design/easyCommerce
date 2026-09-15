import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PayrollRunStatusEnum {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
  PAID = 'PAID',
}

@Entity('hr_payroll_runs')
@Index('IDX_hr_payroll_runs_storeId_year_month', ['storeId', 'year', 'month'], { unique: true })
export class PayrollRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_payroll_runs_storeId')
  storeId: string;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'enum', enum: PayrollRunStatusEnum, default: PayrollRunStatusEnum.DRAFT })
  status: PayrollRunStatusEnum;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalGrossAmount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalDeductions: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalNetAmount: string;

  /** Active employees at generation time that had no salary structure yet, so no
   *  payslip could be produced for them — surfaced to HR rather than silently skipped. */
  @Column({ type: 'int', default: 0 })
  skippedEmployeeCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  finalizedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
