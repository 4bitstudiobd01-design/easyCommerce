import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('theme_purchases')
export class ThemePurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 100 })
  themeId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 50, default: 'COMPLETED' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'BALANCE' })
  paymentMethod: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
