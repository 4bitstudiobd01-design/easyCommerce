import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CustomerStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  GUEST = 'GUEST',
}

export enum CustomerAccountTypeEnum {
  REGISTERED = 'REGISTERED',
  GUEST = 'GUEST',
}

export enum CustomerSourceEnum {
  ONLINE_STORE = 'ONLINE_STORE',
  MANUAL = 'MANUAL',
  POS = 'POS',
  IMPORT = 'IMPORT',
}

@Entity('customers')
@Index(['tenantId', 'phone'])
@Index(['tenantId', 'email'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'createdAt'])
@Index('IDX_customers_tenant_email_registered', ['tenantId', 'email'], {
  unique: true,
  where: '"passwordHash" IS NOT NULL',
})
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  storeId?: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50 })
  phone: string;

  @Column({
    type: 'enum',
    enum: CustomerStatusEnum,
    default: CustomerStatusEnum.ACTIVE,
  })
  status: CustomerStatusEnum;

  @Column({
    type: 'enum',
    enum: CustomerAccountTypeEnum,
    default: CustomerAccountTypeEnum.GUEST,
    nullable: true,
  })
  accountType?: CustomerAccountTypeEnum;

  @Column({
    type: 'enum',
    enum: CustomerSourceEnum,
    default: CustomerSourceEnum.ONLINE_STORE,
  })
  source: CustomerSourceEnum;

  /**
   * Storefront login credential. `select: false` keeps it out of the many
   * existing `customerRepository.find(...)` call sites across the merchant
   * console — the login service opts in explicitly via `.addSelect(...)`.
   */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash?: string;

  /** True once passwordHash is set — distinguishes a guest-only row (created by checkout) from a registered login. */
  @Column({ type: 'boolean', default: false })
  hasAccount: boolean;

  /**
   * Marketing origin captured at registration time, same vocabulary as
   * Order.channel/utmSource/etc (see normalizeChannel()). Populated once and
   * never overwritten by a later registration on an already-guest row, so it
   * reflects true first-touch attribution from the customer's first order.
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  registrationChannel?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  registrationUtmSource?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  registrationUtmMedium?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  registrationUtmCampaign?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  registrationReferrerHost?: string;

  /**
   * Cached FraudBD (fraudbd.com) courier delivery-history check, keyed by
   * phone. Fetched on-demand (customer detail view, order row expand) and
   * cached here rather than re-queried every render — FraudBD is rate
   * limited (60 req/min) and the underlying delivery history changes slowly.
   * Null until the first check is performed for this customer.
   */
  @Column({ type: 'int', nullable: true })
  fraudTotalOrders?: number;

  @Column({ type: 'int', nullable: true })
  fraudSuccessOrders?: number;

  @Column({ type: 'int', nullable: true })
  fraudCancelOrders?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fraudSuccessRate?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  fraudCancelRate?: number;

  /** Per-courier breakdown (Pathao/Steadfast/Paperfly/Redx), stored as returned by FraudBD. */
  @Column({ type: 'jsonb', nullable: true })
  fraudSummaries?: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  fraudCheckedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
