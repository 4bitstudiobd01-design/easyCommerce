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
import { ShiftEntity } from './shift.entity';

@Entity('hr_shift_assignments')
@Index('IDX_hr_shift_assignments_employeeId_date', ['employeeId', 'date'], { unique: true })
export class ShiftAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_shift_assignments_storeId')
  storeId: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: EmployeeEntity;

  @Column({ type: 'uuid' })
  shiftId: string;

  /** Assignments block shift deletion (RESTRICT) — reassign or clear the roster cells first. */
  @ManyToOne(() => ShiftEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shiftId' })
  shift?: ShiftEntity;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'uuid', nullable: true })
  assignedByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
