import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentTransactionStatusEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 50 })
  orderNumber: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  tranId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  valId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'BDT' })
  currency: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cardType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bankTranId?: string;

  @Column({
    type: 'enum',
    enum: PaymentTransactionStatusEnum,
    default: PaymentTransactionStatusEnum.PENDING,
  })
  status: PaymentTransactionStatusEnum;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
