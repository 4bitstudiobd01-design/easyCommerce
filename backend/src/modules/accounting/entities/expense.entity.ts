import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ExpensePaymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
  MOBILE_BANKING = 'MOBILE_BANKING',
}

export enum ExpenseStatusEnum {
  PAID = 'PAID',
  DUE = 'DUE',
}

/**
 * An operating expense / bill. On create with status PAID (or when later marked paid) a
 * balanced journal entry is posted: debit the mapped expense account, credit the paid-from
 * account (Cash/Bank). DUE expenses debit the expense account and credit Accounts Payable.
 */
@Entity('acc_expenses')
@Index('IDX_acc_expenses_storeId_expenseNumber', ['storeId', 'expenseNumber'], { unique: true })
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_expenses_storeId')
  storeId: string;

  /** Per-store voucher number, e.g. "EXP-2026-0089". */
  @Column({ type: 'varchar', length: 40 })
  expenseNumber: string;

  @Column({ type: 'date' })
  @Index('IDX_acc_expenses_storeId_date')
  date: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  note?: string;

  /** Free-text category label shown in the table (Marketing, Shipping, …). */
  @Column({ type: 'varchar', length: 80 })
  category: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  vendor?: string;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: ExpensePaymentMethodEnum, default: ExpensePaymentMethodEnum.CASH })
  paymentMethod: ExpensePaymentMethodEnum;

  @Column({ type: 'enum', enum: ExpenseStatusEnum, default: ExpenseStatusEnum.PAID })
  status: ExpenseStatusEnum;

  /** COA account this expense is booked against (an EXPENSE-type account). */
  @Column({ type: 'uuid', nullable: true })
  expenseAccountId?: string;

  /** COA account the money was paid from (Cash/Bank). Null while status is DUE. */
  @Column({ type: 'uuid', nullable: true })
  paidFromAccountId?: string;

  /** The journal entry posted for this expense, once it exists. */
  @Column({ type: 'uuid', nullable: true })
  journalEntryId?: string;

  @Column({ type: 'text', nullable: true })
  receiptUrl?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
