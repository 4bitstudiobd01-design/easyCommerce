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

export enum LeaveTypeEnum {
  EARNED = 'EARNED',
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
}

export enum LeaveStatusEnum {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('hr_leave_requests')
export class LeaveRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_leave_requests_storeId')
  storeId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_leave_requests_employeeId')
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: EmployeeEntity;

  @Column({ type: 'enum', enum: LeaveTypeEnum })
  leaveType: LeaveTypeEnum;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  /** Inclusive day count between startDate and endDate. Does not currently exclude
   *  weekends/holidays — a known simplification, revisit once shift/roster data
   *  (Phase 4) can tell working days apart from days off. */
  @Column({ type: 'int' })
  totalDays: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'enum', enum: LeaveStatusEnum, default: LeaveStatusEnum.PENDING })
  status: LeaveStatusEnum;

  /** References FileEntity.id (file module) by id only — never joined across modules.
   *  Retrieved only through the authenticated /hr/leave-requests/:id/document endpoint,
   *  never the file module's own public URL, since medical documents must stay private. */
  @Column({ type: 'uuid', nullable: true })
  documentFileId?: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
