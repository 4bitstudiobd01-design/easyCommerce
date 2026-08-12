import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  // Payment window missed, still within grace period — plan limits still apply
  // at the last-active tier but renewal is overdue.
  PAST_DUE = 'PAST_DUE',
  // Grace period expired — tenant has been stepped down to the Free plan.
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  tenantId: string;

  @Column({ type: 'uuid' })
  planId: string;

  @Column({ type: 'enum', enum: SubscriptionStatusEnum, default: SubscriptionStatusEnum.ACTIVE })
  status: SubscriptionStatusEnum;

  @Column({ type: 'timestamptz' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamptz' })
  currentPeriodEnd: Date;

  // When PAST_DUE, the tenant is auto-downgraded to Free once now() passes this.
  @Column({ type: 'timestamptz', nullable: true })
  gracePeriodEndsAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
