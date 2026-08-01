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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
