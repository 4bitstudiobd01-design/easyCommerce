import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { FinanceInvoiceStatusEnum } from '../enums/finance.enums';
import { FinanceInvoiceItemEntity } from './finance-invoice-item.entity';

@Entity('fin_invoices')
@Index('IDX_fin_invoices_tenantId_storeId', ['tenantId', 'storeId'])
@Index('IDX_fin_invoices_storeId_status', ['storeId', 'status'])
@Index('IDX_fin_invoices_storeId_invoiceNumber', ['storeId', 'invoiceNumber'], { unique: true })
export class FinanceInvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_invoices_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_invoices_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 50 })
  invoiceNumber: string;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  @Column({ type: 'varchar', length: 200 })
  customerName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  customerPhone?: string;

  @Column({ type: 'text', nullable: true })
  customerAddress?: string;

  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discountAmount: string;

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
    enum: FinanceInvoiceStatusEnum,
    default: FinanceInvoiceStatusEnum.UNPAID,
  })
  status: FinanceInvoiceStatusEnum;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @OneToMany(() => FinanceInvoiceItemEntity, (item) => item.invoice, { cascade: true })
  items: FinanceInvoiceItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
