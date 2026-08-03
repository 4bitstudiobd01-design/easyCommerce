import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('newsletter_subscribers')
export class NewsletterSubscriberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'boolean', default: true })
  isSubscribed: boolean;

  @Column({ type: 'varchar', length: 100, default: 'STOREFRONT_FOOTER' })
  source: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  subscribedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  unsubscribedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
