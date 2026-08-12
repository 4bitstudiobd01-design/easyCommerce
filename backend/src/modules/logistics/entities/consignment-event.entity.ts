import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConsignmentEntity, ConsignmentStatusEnum } from './consignment.entity';

@Entity('consignment_events')
export class ConsignmentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  consignmentId: string;

  @ManyToOne(() => ConsignmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consignmentId' })
  consignment: ConsignmentEntity;

  @Column({ type: 'varchar', length: 50 })
  status: ConsignmentStatusEnum;

  @Column({ type: 'timestamptz' })
  eventTimestamp: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
