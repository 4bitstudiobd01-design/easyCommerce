import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StaffRoleEnum {
  STORE_MANAGER = 'STORE_MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  ORDER_FULFILLMENT = 'ORDER_FULFILLMENT',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  CUSTOM = 'CUSTOM',
}

export enum StaffStatusEnum {
  ACTIVE = 'ACTIVE',
  PENDING_INVITE = 'PENDING_INVITE',
  SUSPENDED = 'SUSPENDED',
}

export type StaffPermissionType =
  | 'products:read'
  | 'products:write'
  | 'orders:read'
  | 'orders:manage'
  | 'inventory:read'
  | 'inventory:transfer'
  | 'reviews:read'
  | 'reviews:moderate'
  | 'customers:read'
  | 'coupons:read'
  | 'coupons:write'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write'
  | 'staff:manage'
  | 'hr:employees:manage'
  | 'hr:employees:read'
  | 'hr:attendance:manage'
  | 'hr:leave:manage'
  | 'hr:leave:self'
  | 'hr:shifts:manage'
  | 'hr:expenses:manage'
  | 'hr:payroll:manage'
  | 'hr:notices:manage'
  | 'accounting:read'
  | 'accounting:manage'
  | 'accounting:settings:manage'
  | 'purchases:read'
  | 'purchases:manage'
  | 'finance:read'
  | 'finance:manage'
  | 'finance:transactions:manage'
  | 'finance:invoices:manage'
  | 'finance:bills:manage'
  | 'finance:accounts:manage'
  | 'finance:transfers:manage'
  | 'finance:reports:read'
  | 'finance:settings:manage';

@Entity('staff_members')
export class StaffMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, default: StaffRoleEnum.CUSTOM })
  role: string;

  @Column({ type: 'jsonb', default: [] })
  permissions: StaffPermissionType[];

  @Column({ type: 'varchar', length: 50, default: StaffStatusEnum.PENDING_INVITE })
  status: StaffStatusEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  inviteToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  inviteExpiresAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  invitedByUserId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
