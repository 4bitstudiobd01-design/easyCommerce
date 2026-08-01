import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationTypeEnum {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  STOCK_LOW = 'STOCK_LOW',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
}

@Entity('push_notifications')
export class PushNotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: NotificationTypeEnum, default: NotificationTypeEnum.ORDER_PLACED })
  type: NotificationTypeEnum;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
