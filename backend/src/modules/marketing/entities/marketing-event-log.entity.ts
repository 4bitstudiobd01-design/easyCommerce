import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MarketingProviderEnum } from './marketing-pixel.entity';

export enum MarketingEventStatusEnum {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum MarketingEventTransportEnum {
  /** Fired by the storefront pixel script in the visitor's browser. */
  BROWSER = 'BROWSER',
  /** Sent by the server to the provider's API (CAPI / Events API / Measurement Protocol). */
  SERVER = 'SERVER',
}

/**
 * Append-only record of every event dispatch attempt — the data behind the Event
 * Log view and the Sales-by-Source per-pixel delivery health column (Phase 5).
 *
 * NOTE (Phase 0): the new columns are additive and nullable so the legacy test-event
 * rows written before Phase 1 stay valid. `pixelId` is an id reference to
 * marketing_pixels (ON DELETE SET NULL) — no ORM relation, so history survives a
 * pixel deletion. `orderId` is an id reference only; there is no FK across the
 * module boundary into Order.
 */
@Entity('marketing_event_logs')
@Index(['tenantId', 'storeId'])
@Index(['tenantId', 'storeId', 'createdAt'])
@Index(['tenantId', 'storeId', 'eventName'])
@Index(['tenantId', 'storeId', 'orderId'])
@Index(['pixelId'])
export class MarketingEventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index()
  storeId: string;

  /** FK-ish -> marketing_pixels.id (ON DELETE SET NULL in the migration); null for legacy rows. */
  @Column({ type: 'uuid', nullable: true })
  pixelId: string | null;

  /** Denormalised so the log reads without a join. */
  @Column({ type: 'enum', enum: MarketingProviderEnum, nullable: true })
  provider: MarketingProviderEnum | null;

  @Column({ type: 'varchar', length: 100 })
  eventName: string;

  @Column({
    type: 'enum',
    enum: MarketingEventTransportEnum,
    default: MarketingEventTransportEnum.BROWSER,
  })
  transport: MarketingEventTransportEnum;

  @Column({ type: 'varchar', length: 100 })
  source: string; // e.g., 'Meta Pixel', 'TikTok Events API'

  /** storefront_sessions.sessionId this event belongs to, when known. */
  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null;

  /** Order id for Purchase / InitiateCheckout events tied to an order (id reference only). */
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  orderRef: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmSource: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmMedium: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmCampaign: string | null;

  @Column({
    type: 'enum',
    enum: MarketingEventStatusEnum,
  })
  status: MarketingEventStatusEnum;

  @Column({ type: 'int', nullable: true })
  httpStatus: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /**
   * @deprecated Legacy free-text error column. New code writes `errorMessage`;
   * kept so pre-Phase-1 rows still read.
   */
  @Column({ type: 'text', nullable: true })
  errorDetails: string;

  @Column({ type: 'jsonb', nullable: true })
  payloadJson: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
