import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Null for a custom/off-catalog line item — see isCustomItem. */
  @Column({ type: 'uuid', nullable: true })
  productId?: string | null;

  @Column({ type: 'varchar', length: 255 })
  productTitle: string;

  @Column({ type: 'uuid', nullable: true })
  variantId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variantTitle?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  /**
   * Denormalized from the catalog product's primary image at the time this line
   * was added, matching this entity's existing style (productTitle, sku). Null
   * for custom items, which have no catalog product to read an image from — the
   * UI shows a placeholder icon instead.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  productImageUrl?: string | null;

  /**
   * True for a merchant-entered line item with no catalog product behind it —
   * never persisted to the catalog, never stock-tracked. An explicit flag rather
   * than inferring from `productId IS NULL`, so intent is never ambiguous.
   */
  @Column({ type: 'boolean', default: false })
  isCustomItem: boolean;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'integer' })
  quantity: number;

  /** Per-line discount, separate from the order-wide discount on OrderEntity. */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
