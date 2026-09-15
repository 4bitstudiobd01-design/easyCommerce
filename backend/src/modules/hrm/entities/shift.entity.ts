import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hr_shifts')
@Index('IDX_hr_shifts_storeId_name', ['storeId', 'name'], { unique: true })
export class ShiftEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_shifts_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  /** Hex color used to distinguish shifts on the roster grid, e.g. "#2563EB". */
  @Column({ type: 'varchar', length: 20, default: '#2563EB' })
  colorTag: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
