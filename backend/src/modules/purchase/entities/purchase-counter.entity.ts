import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * The document families that carry an auto-incrementing per-store number in the purchase
 * module. Kept local rather than extending the accounting module's numbering.
 */
export enum PurchaseCounterKindEnum {
  PO = 'PO',
  BILL = 'BILL',
  PAYMENT = 'PAYMENT',
}

/**
 * Prefix / next-sequence for one purchase document family. AllocatePurchaseNumberService
 * bumps nextSequence atomically and formats "{prefix}{YYYY}-{seq padded to 4}".
 */
@Entity('pur_number_counters')
@Index('IDX_pur_number_counters_storeId_kind', ['storeId', 'kind'], { unique: true })
export class PurchaseCounterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_number_counters_storeId')
  storeId: string;

  @Column({ type: 'enum', enum: PurchaseCounterKindEnum })
  kind: PurchaseCounterKindEnum;

  @Column({ type: 'varchar', length: 12, default: '' })
  prefix: string;

  @Column({ type: 'int', default: 1 })
  nextSequence: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
