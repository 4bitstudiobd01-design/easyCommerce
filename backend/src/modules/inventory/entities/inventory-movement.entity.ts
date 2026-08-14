import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from './inventory-stock.entity';
import { MovementType } from '../enums/inventory-movement-type.enum';

@Entity('inventory_movements')
@Index('IDX_inventory_movements_prod', ['productId'])
@Index('IDX_inventory_movements_tenant', ['tenantId'])
@Index('IDX_inventory_movements_var', ['variantId'])
@Index('IDX_inventory_movements_stock', ['inventoryStockId'])
export class InventoryMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: ProductEntity;

  @Column({ type: 'uuid', nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariantEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariantEntity;

  @Column({ type: 'uuid', nullable: true })
  inventoryStockId?: string;

  @ManyToOne(() => InventoryStockEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'inventoryStockId' })
  inventoryStock?: InventoryStockEntity;

  @Column({ type: 'enum', enum: MovementType, default: MovementType.ADJUSTMENT })
  type: MovementType;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'integer' })
  previousQuantity: number;

  @Column({ type: 'integer' })
  newQuantity: number;

  @Column({ type: 'varchar', length: 255, default: 'Manual Adjustment' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
