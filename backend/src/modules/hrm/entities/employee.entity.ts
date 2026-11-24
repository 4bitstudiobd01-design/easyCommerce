import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DepartmentEntity } from './department.entity';

export enum EmploymentTypeEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum EmploymentStatusEnum {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum EmployeeGenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum MaritalStatusEnum {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
}

export interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

@Entity('hr_employees')
@Index('IDX_hr_employees_storeId_employeeCode', ['storeId', 'employeeCode'], { unique: true })
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_employees_storeId')
  storeId: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToOne(() => DepartmentEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'departmentId' })
  department?: DepartmentEntity;

  /**
   * Reserved for Phase 3 (employee self-service): links this HR record to a dashboard
   * login (a StaffMemberEntity granted an `hr:*` permission) once the merchant invites
   * this employee to self-service. Referenced by id only — never joined across modules.
   */
  @Column({ type: 'uuid', nullable: true })
  linkedUserId?: string;

  /** Human-friendly per-store identifier, e.g. "EMP-0001". Assigned on create, immutable. */
  @Column({ type: 'varchar', length: 20 })
  employeeCode: string;

  @Column({ type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  designation?: string;

  @Column({ type: 'enum', enum: EmploymentTypeEnum, default: EmploymentTypeEnum.FULL_TIME })
  employmentType: EmploymentTypeEnum;

  @Column({ type: 'enum', enum: EmploymentStatusEnum, default: EmploymentStatusEnum.ACTIVE })
  employmentStatus: EmploymentStatusEnum;

  @Column({ type: 'date' })
  dateOfJoining: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: string;

  @Column({ type: 'enum', enum: EmployeeGenderEnum, nullable: true })
  gender?: EmployeeGenderEnum;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  emergencyContactName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergencyContactPhone?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergencyContactRelation?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  secondaryEmergencyContactName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  secondaryEmergencyContactPhone?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  secondaryEmergencyContactRelation?: string;

  @Column({ type: 'uuid', nullable: true })
  reportsToEmployeeId?: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reportsToEmployeeId' })
  reportsTo?: EmployeeEntity;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nationalId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  passportNumber?: string;

  @Column({ type: 'date', nullable: true })
  passportExpiryDate?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  religion?: string;

  @Column({ type: 'enum', enum: MaritalStatusEnum, nullable: true })
  maritalStatus?: MaritalStatusEnum;

  @Column({ type: 'varchar', length: 150, nullable: true })
  spouseName?: string;

  @Column({ type: 'boolean', nullable: true })
  spouseEmployed?: boolean;

  @Column({ type: 'int', nullable: true })
  numberOfChildren?: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankAccountNumber?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  bankBranchName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankRoutingNumber?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'jsonb', nullable: true })
  education?: EducationEntry[];

  @Column({ type: 'jsonb', nullable: true })
  experience?: ExperienceEntry[];

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
