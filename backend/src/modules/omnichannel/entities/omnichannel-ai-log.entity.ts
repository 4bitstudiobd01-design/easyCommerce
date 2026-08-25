import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { OmnichannelPlatformType } from './omnichannel-credential.entity';
import { AiProviderType } from './omnichannel-ai-config.entity';

export type AiExecutionStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED_PAUSED'
  | 'SKIPPED_AGENT_ACTIVE'
  | 'SKIPPED_DISABLED';

@Entity('omnichannel_ai_logs')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'conversationId'])
export class OmnichannelAiLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  conversationId: string;

  @Column({ type: 'varchar', length: 50 })
  platform: OmnichannelPlatformType;

  @Column({ type: 'varchar', length: 50 })
  provider: AiProviderType;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'text' })
  userQuery: string;

  @Column({ type: 'text', nullable: true })
  aiResponse?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'SUCCESS',
  })
  status: AiExecutionStatus;

  @Column({ type: 'int', default: 0 })
  tokensUsed: number;

  @Column({ type: 'int', default: 0 })
  latencyMs: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
