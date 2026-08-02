import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  ON_HOLD = 'ON_HOLD',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  PAYMENT_ON_PROCESS = 'PAYMENT_ON_PROCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum PaymentMethodEnum {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  SSLCOMMERZ = 'SSLCOMMERZ',
}

export enum PaymentStatusEnum {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ type: 'varchar', length: 255 })
  customerName: string;

  @Column({ type: 'varchar', length: 50 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail?: string;

  @Column({ type: 'text' })
  shippingAddress: string;

  @Column({ type: 'varchar', length: 100, default: 'Dhaka' })
  city: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 60 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

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

  @Column({ type: 'uuid' })
  tenantId: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  items: OrderItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
