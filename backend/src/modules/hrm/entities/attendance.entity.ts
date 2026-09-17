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

export enum AttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
}

@Entity('hr_attendance')
@Index('IDX_hr_attendance_employeeId_date', ['employeeId', 'date'], { unique: true })
export class AttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_attendance_storeId')
  storeId: string;

  @Column({ type: 'uuid' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee?: EmployeeEntity;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: AttendanceStatusEnum })
  status: AttendanceStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  checkInAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  checkOutAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  /** The dashboard user (owner or hr:attendance:manage staff) who recorded/last edited this. */
  @Column({ type: 'uuid', nullable: true })
  markedByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
