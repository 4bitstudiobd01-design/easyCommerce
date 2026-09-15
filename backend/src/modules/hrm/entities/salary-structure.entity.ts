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

/**
 * One active pay structure per employee — editing it overwrites the current figures
 * rather than versioning history. A documented simplification: mid-month salary
 * revisions apply from the next payroll run, not retroactively.
 */
@Entity('hr_salary_structures')
export class SalaryStructureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_salary_structures_storeId')
  storeId: string;

  @Column({ type: 'uuid', unique: true })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: EmployeeEntity;

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

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  providentFundDeduction: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
