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
import { StoreEntity } from './store.entity';

/**
 * A physical outlet/showroom under a Store (e.g. "Dhanmondi Outlet"). Distinct
 * from Warehouse, which is a stock-storage location — a Branch may later own a
 * dedicated warehouse or share a central/tenant-wide one (wired up in Phase 2).
 * Other modules (staff/order/accounting) reference branches only by raw
 * branchId uuid columns per the module boundary rule; only Store keeps a real
 * relation here since Branch is a direct extension of the Store hierarchy.
 */
@Entity('branches')
@Index(['tenantId', 'storeId'])
export class BranchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @ManyToOne(() => StoreEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'storeId' })
  store: StoreEntity;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Raw FK to warehouses.id (Inventory module) — never a TypeORM relation,
   * per the cross-module boundary rule. Null means this branch has no
   * dedicated warehouse and shares the central/tenant-wide warehouse instead
   * of owning stock separately. Set via Phase 2 warehouse-branch linking.
   */
  @Column({ type: 'uuid', nullable: true })
  warehouseId?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
