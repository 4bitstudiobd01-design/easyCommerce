import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { CourierProviderEnum } from './consignment.entity';

/**
 * Per-provider credential bag.
 *
 * Providers do not share an auth shape — Steadfast issues an api key/secret
 * pair, Pathao an OAuth client id/secret plus a store id, RedX a single bearer
 * token, Paperfly a username/password. Keeping them in one jsonb column means
 * adding a provider never costs a migration, and the encryption boundary stays
 * a single field rather than one per credential.
 */
export interface CourierCredentialBag {
  apiKey?: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
  /** CarryBee's third auth header, issued alongside Client-ID / Client-Secret. */
  clientContext?: string;
  /** Pathao's / CarryBee's merchant store id, distinct from the BitCommerce store. */
  merchantStoreId?: string;
  username?: string;
  password?: string;
  baseUrl?: string;
}

/**
 * A merchant's connection to one courier provider.
 *
 * This is deliberately its own table rather than more columns on `stores`:
 * a merchant connects to several providers at once, each with a different
 * credential shape, its own enable/default flags, and its own API health
 * counters. The legacy `stores.steadfastApiKey`/`pathaoClientId` columns stay
 * readable as a fallback so existing merchants keep booking without re-entering
 * anything, but every new write lands here.
 */
@Entity('courier_integrations')
@Unique('UQ_courier_integrations_tenant_provider', ['tenantId', 'provider'])
@Index('IDX_courier_integrations_tenant', ['tenantId'])
export class CourierIntegrationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'enum', enum: CourierProviderEnum })
  provider: CourierProviderEnum;

  /**
   * Whether the merchant has connected this provider. A row can exist with
   * `isEnabled = false` once a merchant disconnects, so their credentials and
   * health history survive a reconnect.
   */
  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  /**
   * The provider pre-selected when booking a parcel. At most one row per tenant
   * carries this — the set-default service clears the others in the same
   * transaction.
   */
  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  /**
   * Encrypted at rest by CredentialsCrypto — never returned raw from any
   * service. Read paths mask it; only the adapter layer sees plaintext.
   */
  @Column({ type: 'text', nullable: true })
  encryptedCredentials?: string | null;

  /** Points the adapters at the provider's sandbox host instead of production. */
  @Column({ type: 'boolean', default: false })
  sandbox: boolean;

  /** Book a parcel automatically when an order becomes ready to ship. */
  @Column({ type: 'boolean', default: false })
  autoCreateShipment: boolean;

  /** Let the scheduled sync pull tracking updates for this provider. */
  @Column({ type: 'boolean', default: true })
  autoUpdateTracking: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastApiSyncAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastWebhookAt?: Date | null;

  /**
   * Rolling API health counters. Success rate is derived as
   * (total - failed) / total, so a provider that has never been called reports
   * "N/A" rather than a misleading 0% or 100%.
   */
  @Column({ type: 'integer', default: 0 })
  apiCallsTotal: number;

  @Column({ type: 'integer', default: 0 })
  apiCallsFailed: number;

  /** Outcome of the merchant's last "Test Connection", for the drawer. */
  @Column({ type: 'timestamptz', nullable: true })
  lastTestedAt?: Date | null;

  @Column({ type: 'boolean', nullable: true })
  lastTestSucceeded?: boolean | null;

  @Column({ type: 'text', nullable: true })
  lastTestMessage?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
