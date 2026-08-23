import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LeadStageEnum {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  WON = 'WON',
  LOST = 'LOST',
}

export enum LeadSourceEnum {
  WEBSITE = 'WEBSITE',
  WHATSAPP = 'WHATSAPP',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  PHONE_CALL = 'PHONE_CALL',
  STORE_INQUIRY = 'STORE_INQUIRY',
  MANUAL = 'MANUAL',
}

@Entity('crm_leads')
@Index(['tenantId', 'stage'])
@Index(['tenantId', 'createdAt'])
export class LeadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId?: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ name: 'company_name', length: 255, nullable: true })
  companyName?: string;

  @Column({
    type: 'enum',
    enum: LeadSourceEnum,
    default: LeadSourceEnum.WEBSITE,
  })
  source: LeadSourceEnum;

  @Column({
    type: 'enum',
    enum: LeadStageEnum,
    default: LeadStageEnum.NEW,
  })
  stage: LeadStageEnum;

  @Column({ name: 'estimated_value', type: 'decimal', precision: 12, scale: 2, default: 0 })
  estimatedValue: number;

  @Column({ name: 'lead_score', type: 'int', default: 50 })
  leadScore: number;

  @Column({ name: 'assigned_staff_id', type: 'uuid', nullable: true })
  assignedStaffId?: string;

  @Column({ name: 'assigned_staff_name', length: 255, nullable: true })
  assignedStaffName?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'tags', type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'converted_customer_id', type: 'uuid', nullable: true })
  convertedCustomerId?: string;

  @Column({ name: 'lost_reason', length: 255, nullable: true })
  lostReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
