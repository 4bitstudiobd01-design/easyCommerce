import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MarketingProviderEnum {
  META = 'META',
  GOOGLE_ANALYTICS = 'GOOGLE_ANALYTICS',
  GOOGLE_ADS = 'GOOGLE_ADS',
  TIKTOK = 'TIKTOK',
}

export enum MarketingPixelStatusEnum {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}

export enum PixelPageScopeModeEnum {
  /** Fire on every storefront page. */
  ALL = 'ALL',
  /** Fire only where a MarketingPixelPageRule matches. */
  RULES = 'RULES',
}

/**
 * One configured pixel *instance*. A merchant may add the same provider more than
 * once (e.g. a prospecting Meta pixel and a retargeting one), so uniqueness is on
 * `id` — not on `(tenantId, storeId, provider)`. `label` disambiguates same-provider
 * pixels for humans and is unique per `(storeId, provider, label)`.
 *
 * NOTE (Phase 0): the new columns below are additive. `accessToken` is kept for the
 * legacy connect/disconnect services until Phase 1 replaces them with multi-instance
 * CRUD; new code writes credentials to `credentialsEncrypted` via
 * MarketingPixelCryptoService instead.
 */
@Entity('marketing_pixels')
@Index(['tenantId', 'storeId'])
@Index(['tenantId', 'storeId', 'provider'])
@Index('UQ_marketing_pixels_store_provider_label', ['storeId', 'provider', 'label'], {
  unique: true,
  where: '"label" IS NOT NULL',
})
export class MarketingPixel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  @Column({
    type: 'enum',
    enum: MarketingProviderEnum,
  })
  provider: MarketingProviderEnum;

  /** Merchant-supplied name, e.g. "Main Meta Pixel". Nullable only for un-migrated legacy rows. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  label: string | null;

  @Column({ type: 'varchar', length: 255 })
  pixelId: string;

  /**
   * @deprecated Legacy single-token column. Kept for the pre-Phase-1 connect/disconnect
   * services; new code uses `credentialsEncrypted`. Removed in the cleanup phase.
   */
  @Column({ type: 'text', nullable: true })
  accessToken: string;

  /** AES-256-GCM ciphertext of a PixelCredentialBag JSON. Never returned in plaintext. */
  @Column({ type: 'text', nullable: true })
  credentialsEncrypted: string | null;

  /** When true, events are also sent server-side (CAPI / Events API / Measurement Protocol). */
  @Column({ type: 'boolean', default: false })
  capiEnabled: boolean;

  @Column({
    type: 'enum',
    enum: PixelPageScopeModeEnum,
    default: PixelPageScopeModeEnum.ALL,
  })
  pageScopeMode: PixelPageScopeModeEnum;

  @Column({
    type: 'enum',
    enum: MarketingPixelStatusEnum,
    default: MarketingPixelStatusEnum.CONNECTED,
  })
  status: MarketingPixelStatusEnum;

  /** Soft on/off, independent of `status`. */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastEventAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
