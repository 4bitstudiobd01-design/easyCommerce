import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { credentialsColumnTransformer } from './omnichannel-credential.transformer';

export type OmnichannelPlatformType =
  | 'telegram'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'x'
  | 'slack'
  | 'custom';

export type OmnichannelCredentialStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending';

@Entity('omnichannel_credentials')
@Index(['tenantId', 'platform'], { unique: true })
export class OmnichannelCredentialEntity {
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
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  accountHandle?: string;

  // Encrypted at rest (AES-256-GCM) via credentialsColumnTransformer — the
  // jsonb value stored on disk is `{ enc: true, payload: '<ciphertext>' }`,
  // never the raw tokens/secrets. Always plaintext Record<string, any> in
  // application code; encryption/decryption happens transparently here.
  @Column({ type: 'jsonb', default: {}, transformer: credentialsColumnTransformer })
  credentials: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'disconnected',
  })
  status: OmnichannelCredentialStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastSyncedAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
