import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('fin_period_locks')
@Index('IDX_fin_period_tenantId_storeId', ['tenantId', 'storeId'])
export class FinancePeriodLockEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_period_tenantId')
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_fin_period_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 100 })
  periodName: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'boolean', default: true })
  isLocked: boolean;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lockedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  lockedByUserId?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  lockedByName?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
