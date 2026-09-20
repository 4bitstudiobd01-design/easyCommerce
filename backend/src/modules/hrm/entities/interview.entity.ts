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
import { CandidateEntity } from './candidate.entity';

export enum InterviewStatusEnum {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('hr_interviews')
export class InterviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_interviews_storeId')
  storeId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_interviews_candidateId')
  candidateId: string;

  @ManyToOne(() => CandidateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate?: CandidateEntity;

  @Column({ type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  interviewerNames?: string;

  @Column({ type: 'text', nullable: true })
  meetingLink?: string;

  @Column({ type: 'enum', enum: InterviewStatusEnum, default: InterviewStatusEnum.SCHEDULED })
  status: InterviewStatusEnum;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
