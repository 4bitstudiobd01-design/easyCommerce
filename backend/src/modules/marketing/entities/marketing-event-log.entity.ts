import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MarketingEventStatusEnum {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('marketing_event_logs')
@Index(['tenantId', 'storeId'])
@Index(['tenantId', 'storeId', 'createdAt'])
export class MarketingEventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  @Column({ type: 'varchar', length: 100 })
  eventName: string;

  @Column({ type: 'varchar', length: 100 })
  source: string; // e.g., 'Meta Pixel', 'Google Analytics'

  @Column({ type: 'varchar', length: 100, nullable: true })
  orderRef: string;

  @Column({
    type: 'enum',
    enum: MarketingEventStatusEnum,
  })
  status: MarketingEventStatusEnum;

  @Column({ type: 'text', nullable: true })
  errorDetails: string;

  @CreateDateColumn()
  createdAt: Date;
}
