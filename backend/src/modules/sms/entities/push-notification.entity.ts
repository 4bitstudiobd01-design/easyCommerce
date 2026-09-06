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

  /**
   * What this notification points at, so the dashboard bell can deep-link.
   * e.g. referenceType 'ORDER' + referenceId = order UUID → /dashboard/orders/:id
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType?: string;

  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
