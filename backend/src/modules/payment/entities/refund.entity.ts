import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';

export enum RefundStatusEnum {
  REQUESTED = 'REQUESTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('refunds')
export class RefundEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  refundNumber: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => PaymentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentEntity;

  @Column({ type: 'uuid', nullable: true })
  returnId?: string; // Optional: Links to a ReturnEntity if refund is from a return

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'varchar', length: 100 })
  method: string;

  @Column({ type: 'enum', enum: RefundStatusEnum, default: RefundStatusEnum.REQUESTED })
  status: RefundStatusEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gatewayRefundId?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
