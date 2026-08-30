import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { FinanceCategoryTypeEnum } from '../enums/finance.enums';

@Entity('fin_categories')
@Index('IDX_fin_categories_tenantId_storeId', ['tenantId', 'storeId'])
export class FinanceCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_categories_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_categories_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'enum', enum: FinanceCategoryTypeEnum })
  type: FinanceCategoryTypeEnum;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'varchar', length: 30, nullable: true })
  color?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
