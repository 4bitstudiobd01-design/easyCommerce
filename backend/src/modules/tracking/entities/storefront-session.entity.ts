import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('storefront_sessions')
@Index(['tenantId', 'channel'])
@Index(['tenantId', 'firstSeenAt'])
export class StorefrontSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  sessionId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  storeSlug: string;

  @Column({ type: 'varchar', length: 50, default: 'direct' })
  channel: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmSource?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmMedium?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmCampaign?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referrerHost?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  landingPage?: string;

  @Column({ type: 'int', default: 1 })
  pageViewCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  firstSeenAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastSeenAt: Date;
}
