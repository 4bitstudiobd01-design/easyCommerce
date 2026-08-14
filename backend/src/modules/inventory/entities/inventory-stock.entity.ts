import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WarehouseEntity } from './warehouse.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';

@Entity('inventory_stocks')
@Index('IDX_inventory_stocks_tenant_prod', ['tenantId', 'productId'])
@Index('IDX_inventory_stocks_tenant_wh', ['tenantId', 'warehouseId'])
@Index('IDX_inventory_stocks_tenant_var', ['tenantId', 'variantId'])
export class InventoryStockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  @Column({ type: 'uuid', nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariantEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariantEntity;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => WarehouseEntity, (warehouse) => warehouse.stocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: WarehouseEntity;

  @Column({ type: 'integer', default: 0 })
  quantityOnHand: number;

  @Column({ type: 'integer', default: 0 })
  quantityReserved: number;

  @Column({ type: 'integer', default: 5 })
  reorderPoint: number;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
