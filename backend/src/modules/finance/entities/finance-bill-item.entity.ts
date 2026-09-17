import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FinanceBillEntity } from './finance-bill.entity';

@Entity('fin_bill_items')
export class FinanceBillItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_bill_items_billId')
  billId: string;

  @ManyToOne(() => FinanceBillEntity, (bill) => bill.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'billId' })
  bill?: FinanceBillEntity;

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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
