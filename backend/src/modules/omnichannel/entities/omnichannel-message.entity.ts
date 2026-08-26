import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OmnichannelPlatformType } from './omnichannel-credential.entity';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'RECEIVED';

@Entity('omnichannel_messages')
@Index(['tenantId', 'platform'])
@Index(['tenantId', 'conversationId'])
@Index(['tenantId', 'createdAt'])
export class OmnichannelMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  storeId?: string;

  @Column({ type: 'varchar', length: 50 })
  platform: OmnichannelPlatformType;

  @Column({ type: 'varchar', length: 255 })
  conversationId: string; // e.g. tg-123456, wa-8801711223344, fb-100293848

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalMessageId?: string;

  @Column({ type: 'varchar', length: 255 })
  senderId: string;

  @Column({ type: 'varchar', length: 255 })
  senderName: string;

  @Column({ type: 'text', nullable: true })
  senderAvatar?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientId?: string;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'INBOUND',
  })
  direction: MessageDirection;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'RECEIVED',
  })
  status: MessageStatus;

  @Column({ type: 'varchar', length: 50, default: 'text' })
  type: string; // text, image, document, interactive

  @Column({ type: 'jsonb', nullable: true })
  rawMetadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
