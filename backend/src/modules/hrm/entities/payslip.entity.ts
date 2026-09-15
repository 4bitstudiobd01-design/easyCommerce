import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { PayrollRunEntity } from './payroll-run.entity';

@Entity('hr_payslips')
@Index('IDX_hr_payslips_payrollRunId_employeeId', ['payrollRunId', 'employeeId'], { unique: true })
export class PayslipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_payslips_storeId')
  storeId: string;

  @Column({ type: 'uuid' })
  payrollRunId: string;

  @ManyToOne(() => PayrollRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payrollRunId' })
  payrollRun?: PayrollRunEntity;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: EmployeeEntity;

  /** Snapshot of the salary structure at generation time — later edits to the
   *  employee's structure must not retroactively change an already-generated payslip. */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  basicSalary: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  houseRentAllowance: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  medicalAllowance: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  conveyanceAllowance: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherAllowance: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  grossSalary: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  providentFundDeduction: string;

  /** Reserved for Phase 7 (Bangladesh tax) — 0 until that phase computes it. Payroll
   *  intentionally does not calculate tax itself; see hr:payroll module notes. */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxDeduction: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherDeductions: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netSalary: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
