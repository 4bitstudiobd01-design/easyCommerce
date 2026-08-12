import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { ReturnItemEntity } from './return-item.entity';

export enum ReturnStatusEnum {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PICKUP_PENDING = 'PICKUP_PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  INSPECTED = 'INSPECTED',
  ACCEPTED = 'ACCEPTED',
  CANCELLED = 'CANCELLED',
}

@Entity('returns')
export class ReturnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  returnNumber: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @Column({ type: 'enum', enum: ReturnStatusEnum, default: ReturnStatusEnum.REQUESTED })
  status: ReturnStatusEnum;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @OneToMany(() => ReturnItemEntity, (item) => item.returnRequest, { cascade: true })
  items: ReturnItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  requestedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  receivedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  inspectedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
