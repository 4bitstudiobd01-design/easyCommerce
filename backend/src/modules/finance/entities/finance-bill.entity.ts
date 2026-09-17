import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { FinanceBillStatusEnum } from '../enums/finance.enums';
import { FinanceBillItemEntity } from './finance-bill-item.entity';

@Entity('fin_bills')
@Index('IDX_fin_bills_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_bills_storeId_status', ['storeId', 'status'])
@Index('IDX_fin_bills_storeId_billNumber', ['storeId', 'billNumber'], { unique: true })
export class FinanceBillEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_bills_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_bills_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 50 })
  billNumber: string;

  @Column({ type: 'varchar', length: 200 })
  supplierName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  supplierContact?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplierEmail?: string;

  @Column({ type: 'varchar', length: 50, default: 'OTHER' })
  category: string;

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  paidAmount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  balanceDue: string;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({
    type: 'enum',
    enum: FinanceBillStatusEnum,
    default: FinanceBillStatusEnum.PENDING,
  })
  status: FinanceBillStatusEnum;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  attachmentFileId?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @OneToMany(() => FinanceBillItemEntity, (item) => item.bill, { cascade: true })
  items: FinanceBillItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
