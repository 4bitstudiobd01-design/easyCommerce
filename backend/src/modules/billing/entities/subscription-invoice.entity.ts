import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvoiceStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

@Entity('subscription_invoices')
export class SubscriptionInvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  subscriptionId: string;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amountBdt: number;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  tranId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  valId?: string;

  @Column({ type: 'enum', enum: InvoiceStatusEnum, default: InvoiceStatusEnum.PENDING })
  status: InvoiceStatusEnum;

  @Column({ type: 'timestamptz' })
  periodStart: Date;

  @Column({ type: 'timestamptz' })
  periodEnd: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
