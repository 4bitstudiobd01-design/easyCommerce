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

@Entity('customer_addresses')
@Index('IDX_customer_addresses_customerId', ['customerId'])
@Index('IDX_customer_addresses_tenantId', ['tenantId'])
@Index('IDX_customer_addresses_tenantId_customerId', ['tenantId', 'customerId'])
export class CustomerAddressEntity {
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

  @Column({ type: 'varchar', length: 50, default: 'Home' })
  label: string;

  @Column({ type: 'varchar', length: 100 })
  recipientName: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'text' })
  addressLine1: string;

  @Column({ type: 'text', nullable: true })
  addressLine2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  area?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  thana?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  division?: string;

  @Column({ type: 'varchar', length: 100, default: 'Dhaka' })
  city: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ type: 'varchar', length: 100, default: 'Bangladesh' })
  country: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
