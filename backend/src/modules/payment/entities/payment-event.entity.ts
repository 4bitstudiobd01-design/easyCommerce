import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';

/**
 * Append-only audit trail of payment lifecycle events, used to render the
 * payment timeline. Also the idempotency ledger for gateway webhooks:
 * `externalEventId` is unique per payment, so a replayed webhook cannot
 * produce a second event (or a second order/refund side effect).
 */
@Entity('payment_events')
@Index('IDX_payment_events_tenant_payment', ['tenantId', 'paymentId'])
export class PaymentEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => PaymentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentEntity;

  @Column({ type: 'enum', enum: PaymentEventTypeEnum })
  type: PaymentEventTypeEnum;

  @Column({ type: 'text', nullable: true })
  message?: string;

  /**
   * Gateway-supplied unique event identifier used for webhook idempotency.
   * Null for internally generated events.
   */
  @Column({ type: 'varchar', length: 190, nullable: true })
  externalEventId?: string;

  /**
   * Non-sensitive gateway metadata only. Never store card numbers, CVV,
   * PINs, gateway secrets or private keys here.
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
