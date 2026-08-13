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
import { CustomerEntity } from './customer.entity';

@Entity('customer_notes')
@Index('IDX_customer_notes_customerId', ['customerId'])
@Index('IDX_customer_notes_tenantId', ['tenantId'])
@Index('IDX_customer_notes_tenantId_customerId', ['tenantId', 'customerId'])
export class CustomerNoteEntity {
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

  @Column({ type: 'uuid', nullable: true })
  authorId?: string;

  @Column({ type: 'varchar', length: 100, default: 'Merchant' })
  authorName: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
