import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BillLineEntity } from './bill-line.entity';

export enum BillPaymentStatusEnum {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export enum BillStatusEnum {
  OPEN = 'OPEN',
  CANCELLED = 'CANCELLED',
}

/**
 * A supplier bill / purchase invoice. On create a balanced Accounts Payable journal entry
 * is posted through PostJournalEntryService (DEBIT Inventory, CREDIT Accounts Payable),
 * unless the store has auto-post disabled. `paidAmount` / `paymentStatus` are maintained
 * by RecordSupplierPaymentService.
 */
@Entity('pur_bills')
@Index('IDX_pur_bills_storeId_billNumber', ['storeId', 'billNumber'], { unique: true })
export class BillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_bills_storeId')
  storeId: string;

  /** Per-store bill number, e.g. "PUR-2026-0125". Shown in the UI as "Purchase No". */
  @Column({ type: 'varchar', length: 40 })
  billNumber: string;

  /** The vendor's own invoice number, if provided. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  supplierInvoiceNo?: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_bills_storeId_supplierId')
  supplierId: string;

  @Column({ type: 'varchar', length: 150 })
  supplierName: string;

  /** Optional link to the PO this bill was raised from. */
  @Column({ type: 'uuid', nullable: true })
  purchaseOrderId?: string;

  @Column({ type: 'date' })
  @Index('IDX_pur_bills_storeId_billDate')
  billDate: string;

  @Column({ type: 'date', nullable: true })
  dueDate?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalAmount: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  paidAmount: string;

  /** Σ line quantities — snapshot for the "items received" list KPI. */
  @Column({ type: 'int', default: 0 })
  itemsCount: number;

  @Column({
    type: 'enum',
    enum: BillPaymentStatusEnum,
    default: BillPaymentStatusEnum.UNPAID,
  })
  @Index('IDX_pur_bills_storeId_paymentStatus')
  paymentStatus: BillPaymentStatusEnum;

  @Column({ type: 'enum', enum: BillStatusEnum, default: BillStatusEnum.OPEN })
  status: BillStatusEnum;

  /** The Accounts Payable journal entry posted for this bill, once it exists. */
  @Column({ type: 'uuid', nullable: true })
  journalEntryId?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @OneToMany(() => BillLineEntity, (line) => line.bill, { cascade: true })
  lines: BillLineEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
