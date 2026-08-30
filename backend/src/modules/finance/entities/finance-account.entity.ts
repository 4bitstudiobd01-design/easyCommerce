import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FinanceAccountTypeEnum } from '../enums/finance.enums';

@Entity('fin_accounts')
@Index('IDX_fin_accounts_tenantId_storeId', ['tenantId', 'storeId'])
export class FinanceAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_accounts_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_accounts_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: FinanceAccountTypeEnum, default: FinanceAccountTypeEnum.BANK })
  type: FinanceAccountTypeEnum;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accountNumber?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  bankOrProviderName?: string;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  currentBalance: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  startingBalance: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
