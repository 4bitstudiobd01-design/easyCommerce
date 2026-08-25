import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AiPausedReason =
  | 'NONE'
  | 'HUMAN_AGENT_TAKEOVER'
  | 'AGENT_MANUAL'
  | 'CUSTOMER_REQUESTED_AGENT'
  | 'ERROR_FALLBACK';

@Entity('omnichannel_conversation_states')
@Index(['tenantId', 'conversationId'], { unique: true })
export class OmnichannelConversationStateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  conversationId: string;

  @Column({ type: 'boolean', default: false })
  isAiPaused: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'NONE',
  })
  pausedReason: AiPausedReason;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pausedByUserId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  aiPausedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastHumanAgentMessageAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastAiMessageAt?: Date;

  @Column({ type: 'int', default: 0 })
  totalAiRepliesCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
