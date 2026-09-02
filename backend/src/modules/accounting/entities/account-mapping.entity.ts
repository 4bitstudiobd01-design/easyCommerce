import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * The automation event a mapping row binds to a GL account. Consumed by the auto-posting
 * seam other slices call; edited on Accounting → Settings → Account Mapping.
 */
export enum AccountMappingEventEnum {
  SALES_REVENUE = 'SALES_REVENUE',
  SHIPPING_INCOME = 'SHIPPING_INCOME',
  COURIER_COST = 'COURIER_COST',
  PAYMENT_GATEWAY_FEE = 'PAYMENT_GATEWAY_FEE',
  SALES_RETURNS = 'SALES_RETURNS',
  COGS = 'COGS',
  INVENTORY_ASSET = 'INVENTORY_ASSET',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  CASH = 'CASH',
  BANK = 'BANK',
  TAX_PAYABLE = 'TAX_PAYABLE',
}

@Entity('acc_account_mappings')
@Index('IDX_acc_account_mappings_storeId_event', ['storeId', 'event'], { unique: true })
export class AccountMappingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_acc_account_mappings_storeId')
  storeId: string;

  @Column({ type: 'enum', enum: AccountMappingEventEnum })
  event: AccountMappingEventEnum;

  /** The COA account this event posts to. Nullable while the merchant has not chosen one. */
  @Column({ type: 'uuid', nullable: true })
  accountId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
