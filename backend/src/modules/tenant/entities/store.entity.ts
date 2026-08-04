import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantEntity } from './tenant.entity';

export enum SmsDriverEnum {
  BULKSMSBD = 'BULKSMSBD',
  GREENWEB = 'GREENWEB',
  TWILIO = 'TWILIO',
  DISABLED = 'DISABLED',
}

export enum EmailDriverEnum {
  SMTP = 'SMTP',
  SENDGRID = 'SENDGRID',
  DISABLED = 'DISABLED',
}

export interface HeroBannerItem {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
}

@Entity('stores')
export class StoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  logo?: string;

  // Branding, Favicon & SEO
  @Column({ type: 'varchar', length: 255, nullable: true })
  favicon?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle?: string;

  @Column({ type: 'text', nullable: true })
  metaDescription?: string;

  // Marketing Pixels & Conversions API (CAPI)
  @Column({ type: 'varchar', length: 255, nullable: true })
  facebookPixelId?: string;

  @Column({ type: 'text', nullable: true })
  facebookCapiToken?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  facebookTestEventCode?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tiktokPixelId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleTagManagerId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  googleAnalyticsId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  snapchatPixelId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pinterestTagId?: string;

  // Visual Theme Styling & Theme System
  @Column({ type: 'varchar', length: 100, default: 'DEFAULT_MODERN' })
  activeThemeId: string;

  @Column({ type: 'jsonb', default: ['DEFAULT_MODERN'] })
  unlockedThemeIds: string[];

  @Column({ type: 'varchar', length: 50, default: '#2563eb' })
  primaryColor: string;

  @Column({ type: 'varchar', length: 50, default: 'Inter' })
  fontFamily: string;

  // Dynamic Hero Slider Banners
  @Column({ type: 'jsonb', nullable: true, default: [] })
  heroBanners?: HeroBannerItem[];

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  // Courier Provider API Keys
  @Column({ type: 'varchar', length: 255, nullable: true })
  steadfastApiKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  steadfastSecretKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pathaoClientId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pathaoClientSecret?: string;

  // Pluggable Notification Drivers (SMS & Email)
  @Column({ type: 'enum', enum: SmsDriverEnum, default: SmsDriverEnum.BULKSMSBD })
  smsDriver: SmsDriverEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smsApiKey?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  smsSenderId?: string;

  @Column({ type: 'enum', enum: EmailDriverEnum, default: EmailDriverEnum.SMTP })
  emailDriver: EmailDriverEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpHost?: string;

  @Column({ type: 'int', nullable: true, default: 587 })
  smtpPort?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpUser?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  smtpPass?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fromEmail?: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Shop Policies
  @Column({ type: 'text', nullable: true })
  privacyPolicy?: string;

  @Column({ type: 'text', nullable: true })
  termsOfService?: string;

  @Column({ type: 'text', nullable: true })
  refundPolicy?: string;

  // Blocklist
  @Column({ type: 'jsonb', nullable: true, default: [] })
  blockedIps?: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  blockedEmails?: string[];

  // Limits
  @Column({ type: 'int', nullable: true, default: 0 })
  maxCodOrdersPerIp?: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  maxOrdersPerDay?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
