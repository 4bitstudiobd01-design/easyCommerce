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
import { JobPostingEntity } from './job-posting.entity';

export enum CandidateStageEnum {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

@Entity('hr_candidates')
export class CandidateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_candidates_storeId')
  storeId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_candidates_jobPostingId')
  jobPostingId: string;

  @ManyToOne(() => JobPostingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobPostingId' })
  jobPosting?: JobPostingEntity;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source?: string;

  @Column({ type: 'enum', enum: CandidateStageEnum, default: CandidateStageEnum.APPLIED })
  stage: CandidateStageEnum;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  appliedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  hiredAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
