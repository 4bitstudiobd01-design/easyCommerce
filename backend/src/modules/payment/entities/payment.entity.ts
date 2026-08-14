import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';

/**
 * Canonical payment transaction status.
 *
 * PENDING/COMPLETED/FAILED/CANCELLED are the original gateway-driven states.
 * REFUNDED and PARTIALLY_REFUNDED are derived post-settlement states written
 * only by the refund domain — never by a client request.
 */
export enum PaymentTransactionStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
}

/** Statuses that represent money successfully captured from the customer. */
export const SETTLED_PAYMENT_STATUSES: PaymentTransactionStatusEnum[] = [
  PaymentTransactionStatusEnum.COMPLETED,
  PaymentTransactionStatusEnum.PARTIALLY_REFUNDED,
  PaymentTransactionStatusEnum.REFUNDED,
];

/** Statuses where funds are still expected but not yet captured. */
export const PENDING_PAYMENT_STATUSES: PaymentTransactionStatusEnum[] = [
  PaymentTransactionStatusEnum.PENDING,
  PaymentTransactionStatusEnum.PROCESSING,
];

@Entity('payments')
@Index('IDX_payments_tenant_created', ['tenantId', 'createdAt'])
@Index('IDX_payments_tenant_status', ['tenantId', 'status'])
@Index('IDX_payments_tenant_gateway', ['tenantId', 'gateway'])
@Index('IDX_payments_tenant_method', ['tenantId', 'paymentMethod'])
@Index('IDX_payments_tenant_order', ['tenantId', 'orderId'])
@Index('IDX_payments_tenant_customer', ['tenantId', 'customerId'])
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 50 })
  orderNumber: string;

  /** Denormalised customer reference — Payment never joins the Customer module's repositories. */
  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  /** Merchant-facing transaction number, e.g. TXN-10245. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  transactionNumber?: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  tranId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  valId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  /**
   * Total amount refunded against this payment. Maintained by the refund
   * domain so refunded totals are never double-counted from refund rows.
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentGatewayEnum,
    default: PaymentGatewayEnum.SSLCOMMERZ,
  })
  gateway: PaymentGatewayEnum;

  @Column({
    type: 'enum',
    enum: PaymentMethodTypeEnum,
    default: PaymentMethodTypeEnum.CARD,
  })
  paymentMethod: PaymentMethodTypeEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cardType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankTranId?: string;

  @Column({
    type: 'enum',
    enum: PaymentTransactionStatusEnum,
    default: PaymentTransactionStatusEnum.PENDING,
  })
  status: PaymentTransactionStatusEnum;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
