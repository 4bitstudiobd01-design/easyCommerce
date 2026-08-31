import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BillEntity } from './bill.entity';

/**
 * One line on a supplier bill. `productId` / `variantId` reference the catalog module by id
 * only; `productName` / `sku` are snapshots taken at creation.
 */
@Entity('pur_bill_lines')
export class BillLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_bill_lines_billId')
  billId: string;

  @ManyToOne(() => BillEntity, (bill) => bill.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billId' })
  bill: BillEntity;

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

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  unitCost: string;

  /** quantity × unitCost, computed at write time. */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  lineTotal: string;

  @Column({ type: 'int', default: 0 })
  lineOrder: number;
}
