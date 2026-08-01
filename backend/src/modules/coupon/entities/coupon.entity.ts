import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DiscountTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

@Entity('coupons')
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'enum', enum: DiscountTypeEnum, default: DiscountTypeEnum.PERCENTAGE })
  discountType: DiscountTypeEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderAmount: number;

  @Column({ type: 'int', default: 100 })
  maxUses: number;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
