import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AiProviderType = 'gemini' | 'openai';
export type AiTriggerMode = 'NO_HUMAN_ACTIVE' | 'ALWAYS' | 'OUTSIDE_HOURS';

@Entity('omnichannel_ai_configs')
export class OmnichannelAiConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index({ unique: true })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  storeId?: string;

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'gemini',
  })
  provider: AiProviderType;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'gemini-1.5-flash',
  })
  model: string;

  @Column({ type: 'text', nullable: true })
  encryptedApiKey?: string | null;

  @Column({
    type: 'text',
    default:
      'You are a helpful, professional, and friendly eCommerce customer support assistant for our store. Answer customer questions regarding products, orders, shipping, payment methods, and return policies accurately and concisely. If you do not know the answer, politely ask the customer to wait for a human support representative.',
  })
  systemPrompt: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'NO_HUMAN_ACTIVE',
  })
  triggerMode: AiTriggerMode;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  @Column({ type: 'int', default: 500 })
  maxTokens: number;

  @Column({ type: 'jsonb', default: {} })
  businessContext: Record<string, any>;

  @Column({
    type: 'jsonb',
    default: { telegram: true, whatsapp: true, instagram: true, facebook: true, x: true },
  })
  enabledPlatforms: Record<string, boolean>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
