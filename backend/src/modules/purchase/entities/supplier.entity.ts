import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SupplierStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * A vendor a merchant store buys stock from. `totalPurchases` / `outstandingDue` shown in
 * the UI are NOT stored here — they are aggregated from the store's bills at read time
 * (see ListSuppliersService), so a payment never has to fan out and rewrite supplier rows.
 */
@Entity('pur_suppliers')
@Index('IDX_pur_suppliers_storeId_name', ['storeId', 'name'], { unique: true })
export class SupplierEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_suppliers_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  contactPerson?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone?: string;

  /** Free-text address / city, e.g. "Dhaka, Bangladesh". */
  @Column({ type: 'varchar', length: 200, nullable: true })
  location?: string;

  @Column({ type: 'enum', enum: SupplierStatusEnum, default: SupplierStatusEnum.ACTIVE })
  status: SupplierStatusEnum;

  /** Payable carried in from before this system, added to the computed outstanding due. */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  openingBalance: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
