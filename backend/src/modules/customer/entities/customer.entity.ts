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
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  storeId?: string;

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
    enum: CustomerSourceEnum,
    default: CustomerSourceEnum.ONLINE_STORE,
  })
  source: CustomerSourceEnum;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
