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
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';
import { FinanceAccountEntity } from './finance-account.entity';
import { FinanceCategoryEntity } from './finance-category.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { FileEntity } from '../../file/entities/file.entity';

@Entity('fin_transactions')
@Index('IDX_fin_transactions_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_transactions_date', ['storeId', 'transactionDate'])
@Index('IDX_fin_transactions_store_type_date', ['storeId', 'type', 'transactionDate'])
@Index('IDX_fin_transactions_store_account', ['storeId', 'accountId'])
export class FinanceTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_transactions_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_transactions_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 50 })
  transactionNumber: string;

  @Column({ type: 'enum', enum: FinanceTransactionTypeEnum })
  type: FinanceTransactionTypeEnum;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'date' })
  transactionDate: string;

  @Column({ type: 'uuid', nullable: true })
  @Index('IDX_fin_transactions_accountId')
  accountId?: string;

  @ManyToOne(() => FinanceAccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'accountId' })
  account?: FinanceAccountEntity;

  @Column({ type: 'uuid', nullable: true })
  toAccountId?: string;

  @ManyToOne(() => FinanceAccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'toAccountId' })
  toAccount?: FinanceAccountEntity;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => FinanceCategoryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: FinanceCategoryEntity;

  @Column({ type: 'varchar', length: 50, nullable: true })
  categoryCode?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string;

  @Column({ type: 'enum', enum: FinanceSourceTypeEnum, default: FinanceSourceTypeEnum.MANUAL })
  sourceType: FinanceSourceTypeEnum;

  @Column({ type: 'uuid', nullable: true })
  sourceId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod?: string;

  @Column({
    type: 'enum',
    enum: FinanceTransactionStatusEnum,
    default: FinanceTransactionStatusEnum.COMPLETED,
  })
  status: FinanceTransactionStatusEnum;

  @Column({ type: 'uuid', nullable: true })
  receiptFileId?: string;

  @ManyToOne(() => FileEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'receiptFileId' })
  receiptFile?: FileEntity;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser?: UserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
