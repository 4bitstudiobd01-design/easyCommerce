import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderEntity, OrderStatusEnum } from './order.entity';

@Entity('order_status_history')
export class OrderStatusHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @Column({ type: 'enum', enum: OrderStatusEnum, nullable: true })
  previousStatus?: OrderStatusEnum;

  @Column({ type: 'enum', enum: OrderStatusEnum })
  newStatus: OrderStatusEnum;

  @Column({ type: 'varchar', length: 255 })
  changedBy: string; // User ID or 'SYSTEM'

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
