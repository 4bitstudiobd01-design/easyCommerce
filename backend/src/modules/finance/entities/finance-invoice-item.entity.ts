import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FinanceInvoiceEntity } from './finance-invoice.entity';

@Entity('fin_invoice_items')
export class FinanceInvoiceItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_invoice_items_invoiceId')
  invoiceId: string;

  @ManyToOne(() => FinanceInvoiceEntity, (inv) => inv.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: FinanceInvoiceEntity;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  unitPrice: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  totalAmount: string;

  @Column({ type: 'uuid', nullable: true })
  productId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
