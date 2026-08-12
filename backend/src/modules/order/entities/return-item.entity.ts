import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReturnEntity } from './return.entity';
import { OrderItemEntity } from './order-item.entity';

export enum ReturnItemConditionEnum {
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
  USED = 'USED',
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
}

@Entity('return_items')
export class ReturnItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  returnId: string;

  @ManyToOne(() => ReturnEntity, (ret) => ret.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'returnId' })
  returnRequest: ReturnEntity;

  @Column({ type: 'uuid' })
  orderItemId: string;

  @ManyToOne(() => OrderItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItemEntity;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'enum', enum: ReturnItemConditionEnum, nullable: true })
  condition?: ReturnItemConditionEnum;

  @Column({ type: 'boolean', nullable: true })
  restockDecision?: boolean;

  @Column({ type: 'text', nullable: true })
  inspectionNote?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
