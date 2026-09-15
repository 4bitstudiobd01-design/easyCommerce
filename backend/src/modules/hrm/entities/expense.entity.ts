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

export enum ExpenseCategoryEnum {
  TRAVEL = 'TRAVEL',
  MEALS = 'MEALS',
  ACCOMMODATION = 'ACCOMMODATION',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  UTILITIES = 'UTILITIES',
  MEDICAL = 'MEDICAL',
  OTHER = 'OTHER',
}

export enum ExpenseStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REIMBURSED = 'REIMBURSED',
}

@Entity('hr_expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_expenses_storeId')
  storeId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_expenses_employeeId')
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: EmployeeEntity;

  @Column({ type: 'enum', enum: ExpenseCategoryEnum })
  category: ExpenseCategoryEnum;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 3, default: 'BDT' })
  currency: string;

  @Column({ type: 'date' })
  expenseDate: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** References FileEntity.id (file module) by id only — never joined across modules.
   *  Retrieved only through the authenticated /hr/expenses/:id/receipt endpoint, never
   *  the file module's own public URL, matching the leave-document security design. */
  @Column({ type: 'uuid', nullable: true })
  receiptFileId?: string;

  @Column({ type: 'enum', enum: ExpenseStatusEnum, default: ExpenseStatusEnum.PENDING })
  status: ExpenseStatusEnum;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reimbursedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
