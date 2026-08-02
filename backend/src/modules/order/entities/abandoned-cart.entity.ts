import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('abandoned_carts')
@Index(['tenantId'])
@Index(['recoveryToken'])
@Index(['customerPhone'])
export class AbandonedCartEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName?: string;

  @Column({ type: 'varchar', length: 50 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail?: string;

  @Column({ type: 'text', nullable: true })
  shippingAddress?: string;

  @Column({ type: 'jsonb' })
  itemsJson: any[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  recoveryToken: string;

  @Column({ type: 'boolean', default: false })
  isRecovered: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastRemindedAt?: Date;

  @Column({ type: 'uuid' })
  tenantId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
