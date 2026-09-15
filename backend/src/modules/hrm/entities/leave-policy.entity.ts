import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** One row per store. Lazily created with these defaults (Bangladesh-typical annual
 *  allocations) the first time a store's policy is read — merchants can adjust them. */
export const DEFAULT_EARNED_DAYS_PER_YEAR = 15;
export const DEFAULT_CASUAL_DAYS_PER_YEAR = 10;
export const DEFAULT_SICK_DAYS_PER_YEAR = 14;

@Entity('hr_leave_policies')
export class LeavePolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', unique: true })
  @Index('IDX_hr_leave_policies_storeId')
  storeId: string;

  @Column({ type: 'int', default: DEFAULT_EARNED_DAYS_PER_YEAR })
  earnedDaysPerYear: number;

  @Column({ type: 'int', default: DEFAULT_CASUAL_DAYS_PER_YEAR })
  casualDaysPerYear: number;

  @Column({ type: 'int', default: DEFAULT_SICK_DAYS_PER_YEAR })
  sickDaysPerYear: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
