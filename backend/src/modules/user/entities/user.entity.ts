import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SessionEntity } from './session.entity';


export enum UserRoleEnum {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STORE_OWNER = 'STORE_OWNER',
  STORE_STAFF = 'STORE_STAFF',
  CUSTOMER = 'CUSTOMER',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.CUSTOMER,
  })
  role: UserRoleEnum;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  tenantId?: string;

  /** When the user accepted the Terms of Service / Privacy Policy at registration. Null if never recorded (e.g. accounts created before this was tracked). */
  @Column({ type: 'timestamptz', nullable: true })
  termsAcceptedAt?: Date;

  /** Bcrypt hash of the current password-reset OTP. Null when no reset is in progress. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetOtpHash?: string;

  /** Expiry timestamp for the current OTP. Null when no reset is in progress. */
  @Column({ type: 'timestamptz', nullable: true })
  passwordResetOtpExpiresAt?: Date;

  /** Failed verification attempts against the current OTP. Reset to 0 on each new request. */
  @Column({ type: 'int', default: 0 })
  passwordResetAttempts: number;

  /** Timestamp of the last forgot-password request, used for the request cooldown. */
  @Column({ type: 'timestamptz', nullable: true })
  passwordResetLastRequestedAt?: Date;

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions: SessionEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
