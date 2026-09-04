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

@Entity('stock_transfers')
@Index(['tenantId'])
@Index(['fromWarehouseId'])
@Index(['toWarehouseId'])
@Index(['fromBranchId'])
@Index(['toBranchId'])
@Index(['productId'])
export class StockTransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Exactly one of fromWarehouseId/fromBranchId is set — enforced in the service/DTO layer. */
  @Column({ type: 'uuid', nullable: true })
  fromWarehouseId?: string;

  @ManyToOne(() => WarehouseEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'fromWarehouseId' })
  fromWarehouse?: WarehouseEntity;

  /** Raw FK to branches.id (tenant module) — no relation, per module boundary rule. */
  @Column({ type: 'uuid', nullable: true })
  fromBranchId?: string;

  /** Exactly one of toWarehouseId/toBranchId is set — enforced in the service/DTO layer. */
  @Column({ type: 'uuid', nullable: true })
  toWarehouseId?: string;

  @ManyToOne(() => WarehouseEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'toWarehouseId' })
  toWarehouse?: WarehouseEntity;

  /** Raw FK to branches.id (tenant module) — no relation, per module boundary rule. */
  @Column({ type: 'uuid', nullable: true })
  toBranchId?: string;

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

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
