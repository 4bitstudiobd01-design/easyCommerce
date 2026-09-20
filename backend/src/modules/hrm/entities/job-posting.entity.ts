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
import { DepartmentEntity } from './department.entity';
import { EmploymentTypeEnum } from './employee.entity';

export enum JobPostingStatusEnum {
  OPEN = 'OPEN',
  ON_HOLD = 'ON_HOLD',
  CLOSED = 'CLOSED',
}

@Entity('hr_job_postings')
export class JobPostingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_job_postings_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToOne(() => DepartmentEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department?: DepartmentEntity;

  @Column({ type: 'enum', enum: EmploymentTypeEnum, nullable: true })
  employmentType?: EmploymentTypeEnum;

  @Column({ type: 'varchar', length: 150, nullable: true })
  location?: string;

  @Column({ type: 'int', default: 1 })
  openings: number;

  @Column({ type: 'enum', enum: JobPostingStatusEnum, default: JobPostingStatusEnum.OPEN })
  status: JobPostingStatusEnum;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  postedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
