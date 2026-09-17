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
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';

/**
 * A branch's own stock ledger, independent of Warehouse/InventoryStockEntity.
 * branchId is a raw FK (branches table lives in the tenant module) — no
 * TypeORM relation, per the cross-module boundary rule.
 */
@Entity('branch_stocks')
@Index('IDX_branch_stocks_tenant_prod', ['tenantId', 'productId'])
@Index('IDX_branch_stocks_tenant_branch', ['tenantId', 'branchId'])
@Index('IDX_branch_stocks_tenant_var', ['tenantId', 'variantId'])
export class BranchStockEntity {
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
  branchId: string;

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
