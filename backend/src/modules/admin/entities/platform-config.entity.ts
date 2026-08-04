import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('platform_configs')
export class PlatformConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // We enforce a single row by setting a constant key
  @Column({ type: 'varchar', unique: true, default: 'global' })
  configKey: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  heroContent: {
    title?: string;
    subtitle?: string;
    ctaPrimaryText?: string;
    ctaPrimaryLink?: string;
    ctaSecondaryText?: string;
    ctaSecondaryLink?: string;
  };

  @Column({ type: 'jsonb', nullable: true, default: [] })
  pricingPlans: any[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  testimonials: any[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  faqs: any[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
