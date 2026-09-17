import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hr_holidays')
@Index('IDX_hr_holidays_storeId_date', ['storeId', 'date'], { unique: true })
export class HolidayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  @Index('IDX_hr_holidays_storeId')
  storeId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'date' })
  date: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
