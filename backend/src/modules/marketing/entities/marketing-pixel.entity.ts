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

@Entity('marketing_pixels')
@Index(['tenantId', 'storeId'])
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

  @Column({ type: 'varchar', length: 255 })
  pixelId: string;

  @Column({ type: 'text', nullable: true })
  accessToken: string;

  @Column({
    type: 'enum',
    enum: MarketingPixelStatusEnum,
    default: MarketingPixelStatusEnum.CONNECTED,
  })
  status: MarketingPixelStatusEnum;

  @Column({ type: 'timestamp', nullable: true })
  lastEventAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
