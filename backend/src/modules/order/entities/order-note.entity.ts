import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('order_notes')
export class OrderNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isCustomerVisible: boolean; // True if this note/message is meant for or was sent to the customer

  @Column({ type: 'varchar', length: 255 })
  createdBy: string; // User ID who created the note

  @CreateDateColumn()
  createdAt: Date;
}
