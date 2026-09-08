import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PurchaseOrderLineEntity } from './purchase-order-line.entity';

export enum PurchaseOrderStatusEnum {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  FULLY_RECEIVED = 'FULLY_RECEIVED',
  CANCELLED = 'CANCELLED',
}

/**
 * A purchase order raised on a supplier. Header totals are recomputed from the lines on
 * every write. `receivedValue` tracks the cost value received so far; the UI's
 * "received %" is derived as receivedValue / totalAmount.
 */
@Entity('pur_purchase_orders')
@Index('IDX_pur_purchase_orders_storeId_poNumber', ['storeId', 'poNumber'], { unique: true })
export class PurchaseOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_purchase_orders_storeId')
  storeId: string;

  /** Per-store PO number, e.g. "PO-2026-0032". */
  @Column({ type: 'varchar', length: 40 })
  poNumber: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_purchase_orders_storeId_supplierId')
  supplierId: string;

  /** Supplier name snapshot at creation, so a later rename does not rewrite history. */
  @Column({ type: 'varchar', length: 150 })
  supplierName: string;

  @Column({ type: 'date' })
  @Index('IDX_pur_purchase_orders_storeId_orderDate')
  orderDate: string;

  @Column({ type: 'date', nullable: true })
  expectedDate?: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatusEnum,
    default: PurchaseOrderStatusEnum.DRAFT,
  })
  @Index('IDX_pur_purchase_orders_storeId_status')
  status: PurchaseOrderStatusEnum;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalAmount: string;

  /** Σ(line.receivedQuantity × line.unitCost). Recomputed on each receipt. */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  receivedValue: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  /** Set when a bill has been raised from this PO (informational linkage). */
  @Column({ type: 'uuid', nullable: true })
  billId?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @OneToMany(() => PurchaseOrderLineEntity, (line) => line.purchaseOrder, { cascade: true })
  lines: PurchaseOrderLineEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
