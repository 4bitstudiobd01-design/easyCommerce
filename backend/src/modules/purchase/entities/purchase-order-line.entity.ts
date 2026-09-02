import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PurchaseOrderEntity } from './purchase-order.entity';

/**
 * One ordered product on a purchase order. `productId` / `variantId` reference the catalog
 * module by id only (no cross-module relation); `productName` / `sku` are snapshots taken
 * at creation. `receivedQuantity` grows as goods are received against this line.
 */
@Entity('pur_purchase_order_lines')
export class PurchaseOrderLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_purchase_order_lines_purchaseOrderId')
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrderEntity, (po) => po.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder: PurchaseOrderEntity;

  /** Catalog product id — no DB FK, validated in the service. */
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  variantId?: string;

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  receivedQuantity: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  unitCost: string;

  /** quantity × unitCost, computed at write time. */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  lineTotal: string;

  @Column({ type: 'int', default: 0 })
  lineOrder: number;
}
