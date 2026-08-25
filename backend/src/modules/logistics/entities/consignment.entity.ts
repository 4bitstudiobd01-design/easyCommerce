import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ConsignmentEventEntity } from './consignment-event.entity';
import { OrderEntity } from '../../order/entities/order.entity';

export enum CourierProviderEnum {
  STEADFAST = 'STEADFAST',
  PATHAO = 'PATHAO',
  PAPERFLY = 'PAPERFLY',
  REDX = 'REDX',
  PARCELDEX = 'PARCELDEX',
  CARRYBEE = 'CARRYBEE',
}

/**
 * Canonical shipment lifecycle.
 *
 * PENDING is the pre-courier state: the merchant has created the shipment but no
 * booking has been accepted by a provider yet, so no tracking code exists.
 * RETURNING is the in-flight leg of a return, before the parcel is back with the
 * merchant (RETURNED).
 */
export enum ConsignmentStatusEnum {
  PENDING = 'PENDING',
  BOOKED = 'BOOKED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

/**
 * Settlement state of the cash a courier collects on delivery.
 *
 * This is deliberately owned by the shipment rather than derived from the
 * order's payment status: money is collected by the courier at delivery and only
 * later remitted to the merchant, so "collected" and "settled" are distinct
 * facts that the order domain does not model.
 */
export enum CodStatusEnum {
  /** Not a COD parcel — the order was already paid online. */
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  /** COD due, courier has not collected it yet. */
  PENDING = 'PENDING',
  /** Courier collected the cash from the customer. */
  COLLECTED = 'COLLECTED',
  /** Courier remitted the cash to the merchant. */
  SETTLED = 'SETTLED',
  /** Parcel came back, so no cash will ever be collected. */
  RETURNED = 'RETURNED',
}

/** Terminal states — a shipment in one of these never transitions again. */
export const TERMINAL_CONSIGNMENT_STATUSES: readonly ConsignmentStatusEnum[] = [
  ConsignmentStatusEnum.DELIVERED,
  ConsignmentStatusEnum.RETURNED,
  ConsignmentStatusEnum.CANCELLED,
];

/** Statuses the KPI row and donut treat as "awaiting pickup". */
export const PENDING_CONSIGNMENT_STATUSES: readonly ConsignmentStatusEnum[] = [
  ConsignmentStatusEnum.PENDING,
  ConsignmentStatusEnum.BOOKED,
];

/** Statuses the KPI row and donut treat as "on the way". */
export const IN_TRANSIT_CONSIGNMENT_STATUSES: readonly ConsignmentStatusEnum[] = [
  ConsignmentStatusEnum.PICKED_UP,
  ConsignmentStatusEnum.IN_TRANSIT,
  ConsignmentStatusEnum.OUT_FOR_DELIVERY,
];

@Entity('consignments')
// The list, KPI and analytics queries are all tenant-scoped and ordered by
// creation date, so this composite index serves the dominant access pattern.
@Index('IDX_consignments_tenant_created', ['tenantId', 'createdAt'])
@Index('IDX_consignments_tenant_status', ['tenantId', 'status'])
@Index('IDX_consignments_tenant_cod_status', ['tenantId', 'codStatus'])
@Index('IDX_consignments_tenant_courier', ['tenantId', 'courierProvider'])
@Index('IDX_consignments_tenant_order', ['tenantId', 'orderId'])
export class ConsignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Merchant-facing shipment reference (SHP-10245). Unique per tenant rather
   * than globally, so two merchants can never collide with each other.
   */
  @Column({ type: 'varchar', length: 50 })
  shipmentNumber: string;

  /**
   * Courier's own tracking code. Null until a provider accepts the booking —
   * a PENDING shipment legitimately has no tracking code, and the UI shows
   * "Not Assigned" rather than inventing one.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index('IDX_consignments_tracking_code')
  trackingCode?: string | null;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @Column({ type: 'varchar', length: 50 })
  orderNumber: string;

  /** Denormalised customer reference; the customer domain owns the record. */
  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_consignments_customer')
  customerId?: string | null;

  @Column({ type: 'enum', enum: CourierProviderEnum, default: CourierProviderEnum.STEADFAST })
  courierProvider: CourierProviderEnum;

  @Column({ type: 'varchar', length: 255 })
  recipientName: string;

  @Column({ type: 'varchar', length: 50 })
  recipientPhone: string;

  @Column({ type: 'text' })
  recipientAddress: string;

  @Column({ type: 'varchar', length: 100, default: 'Dhaka' })
  city: string;

  /** Pickup point the courier collects from — the merchant's warehouse/store. */
  @Column({ type: 'text', nullable: true })
  pickupAddress?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  codAmount: number;

  @Column({
    type: 'enum',
    enum: CodStatusEnum,
    default: CodStatusEnum.PENDING,
  })
  codStatus: CodStatusEnum;

  /** When the courier reported the cash as collected. */
  @Column({ type: 'timestamptz', nullable: true })
  codCollectedAt?: Date | null;

  /** When the cash was remitted to the merchant. */
  @Column({ type: 'timestamptz', nullable: true })
  codSettledAt?: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 60 })
  deliveryCharge: number;

  /** Parcel weight in kilograms. */
  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0.5 })
  parcelWeight: number;

  @Column({ type: 'varchar', length: 50, default: 'PARCEL' })
  parcelType: string;

  /** Free-form LxWxH in centimetres, as supplied by the merchant. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  parcelDimensions?: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryNote?: string | null;

  @Column({ type: 'text', nullable: true })
  specialInstructions?: string | null;

  /**
   * Denormalized snapshot of which order items (and quantities) actually shipped
   * in this parcel — a merchant can exclude an item or ship a partial quantity.
   * Null means "the whole order shipped", matching prior behavior for shipments
   * booked before this field existed. Matches this entity's existing style of
   * denormalizing rather than joining (recipientName, codAmount, etc.).
   */
  @Column({ type: 'jsonb', nullable: true })
  shippedItemsJson?: { orderItemId: string; productTitle: string; quantity: number }[] | null;

  @Column({ type: 'enum', enum: ConsignmentStatusEnum, default: ConsignmentStatusEnum.PENDING })
  status: ConsignmentStatusEnum;

  /**
   * Caller-supplied idempotency key. A unique index on (tenantId, key) makes a
   * retried or double-clicked create request resolve to the same shipment
   * instead of booking a second parcel.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  idempotencyKey?: string | null;

  @OneToMany(() => ConsignmentEventEntity, (event) => event.consignment)
  events: ConsignmentEventEntity[];

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
