import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEventEnum {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_UPDATED = 'ORDER_STATUS_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
}

/**
 * An outbound webhook endpoint. Each delivery is signed with `secret` using
 * HMAC-SHA256 over the raw JSON body, sent as the `x-easycommerce-signature`
 * header so the receiver can verify the payload actually came from us.
 */
@Entity('store_webhooks')
@Index(['tenantId', 'storeId'])
export class WebhookEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 500 })
  targetUrl: string;

  @Column({ type: 'jsonb', default: [] })
  events: WebhookEventEnum[];

  @Column({ type: 'varchar', length: 128 })
  secret: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
