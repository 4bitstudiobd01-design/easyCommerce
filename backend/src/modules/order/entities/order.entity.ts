import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  ON_HOLD = 'ON_HOLD',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY_TO_SHIP = 'READY_TO_SHIP',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentMethodEnum {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  SSLCOMMERZ = 'SSLCOMMERZ',
}

export enum PaymentStatusEnum {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
  COD_PENDING = 'COD_PENDING',
  COD_COLLECTED = 'COD_COLLECTED',
  FAILED = 'FAILED',
}

@Entity('orders')
@Index(['tenantId', 'orderNumber'], { unique: true })
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique per tenant, not globally — orderNumber is generated from a
   * per-tenant sequence (see GenerateOrderNumberService), so two different
   * tenants legitimately produce the same padded number (e.g. both start at
   * ORD-000001). See the composite unique index above.
   */
  @Column({ type: 'varchar', length: 50 })
  orderNumber: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 50 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail?: string;

  @Column({ type: 'text' })
  shippingAddress: string;

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

  @Column({ type: 'text', nullable: true })
  customerNote?: string;

  @Column({ type: 'text', nullable: true })
  internalNote?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 60 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  grandTotal: number;

  @Column({ type: 'enum', enum: PaymentMethodEnum, default: PaymentMethodEnum.COD })
  paymentMethod: PaymentMethodEnum;

  @Column({ type: 'enum', enum: PaymentStatusEnum, default: PaymentStatusEnum.UNPAID })
  paymentStatus: PaymentStatusEnum;

  @Column({ type: 'varchar', length: 50, default: OrderStatusEnum.PENDING })
  orderStatus: OrderStatusEnum;

  @Column({ type: 'varchar', length: 100 })
  storeSlug: string;

  @Column({ type: 'varchar', length: 50, default: 'direct' })
  channel: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmSource?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmMedium?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmCampaign?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referrerHost?: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  items: OrderItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Virtual properties for aggregated domain data (not mapped to DB columns in this entity)
  statusHistory?: any[]; // OrderStatusHistoryEntity[]
  consignment?: any;     // ConsignmentEntity
}
