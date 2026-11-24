import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** One row per store. Lazily created with these defaults the first time a store's
 *  policy is read — merchants can adjust them from the Salary Deductions settings tab. */
export const DEFAULT_LATE_ARRIVALS_PER_DEDUCTED_DAY = 4;
export const DEFAULT_DEDUCT_UNMARKED_ABSENCES = true;

@Entity('hr_attendance_deduction_policies')
export class AttendanceDeductionPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid', unique: true })
  @Index('IDX_hr_attendance_deduction_policies_storeId')
  storeId: string;

  /** Every N LATE-marked attendance days in the payroll month = 1 deducted day. */
  @Column({ type: 'int', default: DEFAULT_LATE_ARRIVALS_PER_DEDUCTED_DAY })
  lateArrivalsPerDeductedDay: number;

  /** Whether ABSENT-marked attendance days (not covered by an approved leave) count
   *  as a full deducted day each. */
  @Column({ type: 'boolean', default: DEFAULT_DEDUCT_UNMARKED_ABSENCES })
  deductUnmarkedAbsences: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
