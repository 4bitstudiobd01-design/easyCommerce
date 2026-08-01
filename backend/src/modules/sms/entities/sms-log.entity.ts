import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SmsStatusEnum {
  SENT = 'SENT',
  FAILED = 'FAILED',
  SANDBOX = 'SANDBOX',
}

@Entity('sms_logs')
export class SmsLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  recipientPhone: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, default: 'BULKSMSBD' })
  gateway: string;

  @Column({ type: 'enum', enum: SmsStatusEnum, default: SmsStatusEnum.SANDBOX })
  status: SmsStatusEnum;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;
}
