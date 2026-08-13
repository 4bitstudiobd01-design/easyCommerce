import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CustomerEntity } from './customer.entity';

@Entity('customer_activities')
@Index('IDX_customer_activities_customerId', ['customerId'])
@Index('IDX_customer_activities_tenantId', ['tenantId'])
@Index('IDX_customer_activities_tenantId_customerId', ['tenantId', 'customerId'])
export class CustomerActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  storeId?: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => CustomerEntity, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: CustomerEntity;

  @Column({ type: 'varchar', length: 100 })
  eventType: string; // e.g. 'CUSTOMER_CREATED', 'NOTE_ADDED', 'ADDRESS_ADDED', 'ORDER_PLACED', 'EMAIL_SENT', 'SMS_SENT'

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, default: 'System' })
  actorName: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
