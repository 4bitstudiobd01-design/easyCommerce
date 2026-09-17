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
import { FinanceTransferStatusEnum } from '../enums/finance.enums';
import { FinanceAccountEntity } from './finance-account.entity';

@Entity('fin_transfers')
@Index('IDX_fin_transfers_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_transfers_storeId_transferNumber', ['storeId', 'transferNumber'], { unique: true })
export class FinanceTransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_transfers_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_transfers_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 50 })
  transferNumber: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_transfers_fromAccountId')
  fromAccountId: string;

  @ManyToOne(() => FinanceAccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fromAccountId' })
  fromAccount?: FinanceAccountEntity;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_transfers_toAccountId')
  toAccountId: string;

  @ManyToOne(() => FinanceAccountEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'toAccountId' })
  toAccount?: FinanceAccountEntity;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  fee: string;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'date' })
  transferDate: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: FinanceTransferStatusEnum,
    default: FinanceTransferStatusEnum.COMPLETED,
  })
  status: FinanceTransferStatusEnum;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
