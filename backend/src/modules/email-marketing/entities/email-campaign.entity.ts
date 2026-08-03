import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CampaignRecipientTypeEnum {
  ALL_SUBSCRIBERS = 'ALL_SUBSCRIBERS',
  ALL_CUSTOMERS = 'ALL_CUSTOMERS',
  ALL_AUDIENCE = 'ALL_AUDIENCE',
}

export enum CampaignStatusEnum {
  DRAFT = 'DRAFT',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('email_campaigns')
export class EmailCampaignEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  contentHtml: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: CampaignRecipientTypeEnum.ALL_SUBSCRIBERS,
  })
  recipientType: CampaignRecipientTypeEnum;

  @Column({ type: 'int', default: 0 })
  totalSent: number;

  @Column({ type: 'varchar', length: 50, default: CampaignStatusEnum.DRAFT })
  status: CampaignStatusEnum;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
