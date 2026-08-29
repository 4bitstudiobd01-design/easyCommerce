import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * The five root account classes of a double-entry chart of accounts.
 * Every posting account rolls up to exactly one of these.
 */
export enum AccountTypeEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

/**
 * The side of the ledger on which this account normally carries a positive balance.
 * ASSET/EXPENSE are DEBIT-normal; LIABILITY/EQUITY/REVENUE are CREDIT-normal.
 * Stored explicitly (rather than derived from type) so contra accounts can override it.
 */
export enum NormalBalanceEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('acc_accounts')
@Index('IDX_acc_accounts_storeId_code', ['storeId', 'code'], { unique: true })
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_accounts_storeId')
  storeId: string;

  /** Human-facing account number, e.g. "1010". Unique per store, immutable once posted to. */
  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: AccountTypeEnum })
  type: AccountTypeEnum;

  @Column({ type: 'enum', enum: NormalBalanceEnum })
  normalBalance: NormalBalanceEnum;

  /** Optional grouping parent (another account acting as a header). Referenced by id only. */
  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  /** Free-text note shown in the COA drawer. */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Opening balance carried into the ledger before the first posted journal line.
   * Signed in the account's normal-balance direction. Numeric string to avoid float drift.
   */
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  openingBalance: string;

  /** True when this account was created by the default-chart seeder. */
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
