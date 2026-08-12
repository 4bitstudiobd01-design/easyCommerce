import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PlanCodeEnum {
  FREE = 'FREE',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE',
}

@Entity('plans')
export class PlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PlanCodeEnum, unique: true })
  code: PlanCodeEnum;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlyPriceBdt: number;

  // Null means unlimited.
  @Column({ type: 'int', nullable: true })
  maxStores: number | null;

  @Column({ type: 'int', nullable: true })
  maxStaffPerStore: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
