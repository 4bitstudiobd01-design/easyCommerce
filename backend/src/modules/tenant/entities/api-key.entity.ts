import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * A merchant-issued API key for programmatic store access.
 *
 * Only a SHA-256 hash of the key is stored — the plaintext is returned exactly
 * once, at creation time, and can never be recovered afterwards. `keyPrefix`
 * keeps the first few characters so the merchant can still tell their keys
 * apart in the dashboard without the secret being recoverable.
 */
@Entity('store_api_keys')
@Index(['tenantId', 'storeId'])
export class ApiKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 24 })
  keyPrefix: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  keyHash: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
