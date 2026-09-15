import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

/**
 * A tenant's cached Pathao OAuth2 token pair.
 *
 * Pathao's `issue-token` grant is valid for 5 days (`expires_in: 432000`); the
 * spec explicitly asks that this be persisted and reused rather than re-issued
 * on every call. One row per tenant — sandbox and production never overlap for
 * the same merchant in practice, and a credential/sandbox-toggle change simply
 * invalidates this row (see PathaoAuthService).
 *
 * Tokens are encrypted at rest with the same CredentialsCryptoService used for
 * stored courier credentials — they are bearer secrets, not settings.
 */
@Entity('pathao_tokens')
@Unique('UQ_pathao_tokens_tenant', ['tenantId'])
export class PathaoTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  /** AES-256-GCM ciphertext of `{ accessToken, refreshToken }` (CredentialsCryptoService format). */
  @Column({ type: 'text' })
  encryptedTokens: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  /** Which host this token was issued against — a sandbox token is never valid on production. */
  @Column({ type: 'boolean', default: false })
  sandbox: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
