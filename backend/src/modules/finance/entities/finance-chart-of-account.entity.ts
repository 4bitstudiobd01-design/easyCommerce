import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import {
  FinanceAccountClassEnum,
  FinanceNormalBalanceEnum,
} from '../enums/finance.enums';

@Entity('fin_chart_of_accounts')
@Index('IDX_fin_coa_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_coa_code', ['storeId', 'code'], { unique: true })
export class FinanceChartOfAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_coa_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_coa_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({
    type: 'enum',
    enum: FinanceAccountClassEnum,
  })
  accountClass: FinanceAccountClassEnum;

  @Column({ type: 'varchar', length: 50, default: 'GENERAL' })
  subType: string;

  @Column({
    type: 'enum',
    enum: FinanceNormalBalanceEnum,
  })
  normalBalance: FinanceNormalBalanceEnum;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @ManyToOne(() => FinanceChartOfAccountEntity, (acc) => acc.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: FinanceChartOfAccountEntity;

  @OneToMany(() => FinanceChartOfAccountEntity, (acc) => acc.parent)
  children: FinanceChartOfAccountEntity[];

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  currentBalance: string;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
