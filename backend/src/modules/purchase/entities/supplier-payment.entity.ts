import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum SupplierPaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
  MOBILE_BANKING = 'MOBILE_BANKING',
}

/**
 * An immutable record of money paid to a supplier — against a specific bill or on account.
 * Posts a balanced journal entry (DEBIT Accounts Payable, CREDIT Cash/Bank) through
 * PostJournalEntryService unless the store has auto-post disabled.
 */
@Entity('pur_supplier_payments')
@Index('IDX_pur_supplier_payments_storeId_paymentNumber', ['storeId', 'paymentNumber'], {
  unique: true,
})
export class SupplierPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_supplier_payments_storeId')
  storeId: string;

  /** Per-store payment number, e.g. "SPAY-2026-0007". */
  @Column({ type: 'varchar', length: 40 })
  paymentNumber: string;

  @Column({ type: 'uuid' })
  @Index('IDX_pur_supplier_payments_storeId_supplierId')
  supplierId: string;

  @Column({ type: 'varchar', length: 150 })
  supplierName: string;

  /** The bill this payment settles, if any. Null for an on-account payment. */
  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_pur_supplier_payments_storeId_billId')
  billId?: string;

  @Column({ type: 'date' })
  paymentDate: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: string;

  @Column({
    type: 'enum',
    enum: SupplierPaymentMethodEnum,
    default: SupplierPaymentMethodEnum.CASH,
  })
  method: SupplierPaymentMethodEnum;

  /** COA asset account the money left (Cash/Bank). Defaults from the CASH/BANK mapping. */
  @Column({ type: 'uuid', nullable: true })
  paidFromAccountId?: string;

  /** Cheque no / transaction id. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  reference?: string;

  @Column({ type: 'uuid', nullable: true })
  journalEntryId?: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
